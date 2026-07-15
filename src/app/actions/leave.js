'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function submitLeaveApplication(data) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { error: 'Not authenticated' };
    }

    const { leaveTypeId, fromDate, toDate, subject, reason } = data;

    if (!leaveTypeId || !fromDate || !toDate || !subject || !reason) {
      return { error: 'All fields are required.' };
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    if (startDate > endDate) {
      return { error: 'End date cannot be before start date.' };
    }

    // Calculate days (inclusive)
    const requestedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Get User and their balance
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        leaveBalances: {
          where: {
            leaveTypeId,
            year: new Date().getFullYear(),
          }
        }
      }
    });

    if (!user) return { error: 'User not found' };

    const balance = user.leaveBalances[0];
    if (!balance) {
      return { error: 'No leave balance record found for this leave type for the current year.' };
    }

    const availableDays = balance.totalDays - balance.usedDays;
    if (requestedDays > availableDays) {
      return { error: `Insufficient balance. You requested ${requestedDays} days, but only have ${availableDays} days left.` };
    }

    // Find the user's position in the Hierarchy
    if (!user.departmentId || !user.designationId) {
      return { error: 'Your account is not assigned to a Department and Designation. Please contact HR.' };
    }

    const userNode = await prisma.hierarchyNode.findUnique({
      where: {
        departmentId_designationId: {
          departmentId: user.departmentId,
          designationId: user.designationId,
        }
      },
      include: { parents: true }
    });

    if (!userNode) {
      return { error: 'Your role is not mapped in the Hierarchy Graph. Please ask an Admin to map your Role.' };
    }

    const parents = userNode.parents;
    let status = 'PENDING';

    // If they have no manager (e.g. they are the top of the chain), auto-approve.
    if (!parents || parents.length === 0) {
      status = 'APPROVED';
      // Deduct balance immediately
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedDays: balance.usedDays + requestedDays },
      });
    }

    // Create the Request
    await prisma.leaveRequest.create({
      data: {
        applicantId: user.id,
        leaveTypeId,
        fromDate: startDate,
        toDate: endDate,
        subject,
        reason,
        status,
        pendingAtNodes: parents && parents.length > 0 ? {
          connect: parents.map(p => ({ id: p.id }))
        } : undefined,
      }
    });

    revalidatePath('/dashboard');
    return { success: true };

  } catch (error) {
    console.error('Error submitting leave:', error);
    return { error: 'An unexpected error occurred while submitting.' };
  }
}

export async function getMyLeaves() {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    const leaves = await prisma.leaveRequest.findMany({
      where: { applicantId: session.userId },
      include: {
        leaveType: true,
        pendingAtNodes: {
          include: {
            designation: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, leaves };
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return { error: 'Failed to fetch your leave applications.' };
  }
}

export async function acceptNegotiation(leaveId) {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId, applicantId: session.userId }
    });

    if (!leave || leave.status !== 'NEGOTIATING') {
      return { error: 'Invalid leave request or not in negotiation status.' };
    }

    // When the applicant accepts, we update the dates to the manager's suggested dates, 
    // and bump the status back to PENDING so the manager can do the final approval (or we can just auto approve it, but standard is PENDING).
    // Let's change status to PENDING so the manager can approve the new dates.
    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        fromDate: leave.managerSuggestedFromDate,
        toDate: leave.managerSuggestedToDate,
        managerSuggestedFromDate: null,
        managerSuggestedToDate: null,
        status: 'PENDING'
      }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error accepting negotiation:', error);
    return { error: 'Failed to accept negotiation.' };
  }
}

export async function withdrawLeave(leaveId) {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId, applicantId: session.userId }
    });

    if (!leave) return { error: 'Leave request not found.' };

    await prisma.leaveRequest.delete({
      where: { id: leaveId }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error withdrawing leave:', error);
    return { error: 'Failed to withdraw leave.' };
  }
}

// ==========================================
// MANAGER APPROVAL ACTIONS
// ==========================================

export async function getManagerApprovals() {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.departmentId || !user?.designationId) {
      return { success: true, leaves: [] }; // Not mapped, no approvals
    }

    const userNode = await prisma.hierarchyNode.findUnique({
      where: {
        departmentId_designationId: {
          departmentId: user.departmentId,
          designationId: user.designationId
        }
      }
    });

    if (!userNode) return { success: true, leaves: [] }; // Node doesn't exist

    // Find all leaves pending at THIS node
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        pendingAtNodes: {
          some: { id: userNode.id }
        },
        status: { in: ['PENDING'] } // We only show PENDING in the manager queue. If NEGOTIATING, it's back with the applicant.
      },
      include: {
        applicant: {
          include: {
            designation: true,
            department: true
          }
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, leaves };
  } catch (error) {
    console.error('Error fetching manager approvals:', error);
    return { error: 'Failed to fetch approvals.' };
  }
}

export async function approveLeave(leaveId) {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { pendingAtNodes: true }
    });

    if (!leave) return { error: 'Leave request not found.' };

    // We need to know WHICH manager approved it to route it up THEIR chain.
    // However, since we don't pass manager's node ID directly here, let's find it.
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    const managerNode = await prisma.hierarchyNode.findUnique({
      where: { departmentId_designationId: { departmentId: user.departmentId, designationId: user.designationId } },
      include: { parents: true }
    });

    if (!managerNode) return { error: 'Your role is not mapped.' };

    const nextParents = managerNode.parents;
    
    if (nextParents && nextParents.length > 0) {
      // Still needs approval higher up
      await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: { 
          // Disconnect all current nodes
          pendingAtNodes: { set: [] },
        }
      });
      // Connect new parents
      await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: {
          pendingAtNodes: { connect: nextParents.map(p => ({ id: p.id })) }
        }
      });
    } else {
      // Final approval
      await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: { 
          status: 'APPROVED', 
          pendingAtNodes: { set: [] } 
        }
      });
      
      // Deduct balance
      const requestedDays = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
      
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId: leave.applicantId,
            leaveTypeId: leave.leaveTypeId,
            year: new Date().getFullYear()
          }
        }
      });
      
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { usedDays: balance.usedDays + requestedDays }
        });
      }
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error approving leave:', error);
    return { error: 'Failed to approve leave.' };
  }
}

export async function rejectLeave(leaveId) {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: 'REJECTED' }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting leave:', error);
    return { error: 'Failed to reject leave.' };
  }
}

export async function proposeNewDates(leaveId, fromDate, toDate) {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { 
        status: 'NEGOTIATING',
        managerSuggestedFromDate: new Date(fromDate),
        managerSuggestedToDate: new Date(toDate)
      }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error proposing dates:', error);
    return { error: 'Failed to propose new dates.' };
  }
}

export async function getMyLeaveBalances() {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    const currentYear = new Date().getFullYear();
    const balances = await prisma.leaveBalance.findMany({
      where: {
        userId: session.userId,
        year: currentYear
      },
      include: {
        leaveType: true
      }
    });

    return { success: true, balances };
  } catch (error) {
    console.error('Error fetching balances:', error);
    return { error: 'Failed to fetch balances.' };
  }
}

export async function editLeaveApplication(leaveId, data) {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    const { fromDate, toDate, subject, reason } = data;
    if (!fromDate || !toDate || !subject || !reason) return { error: 'All fields are required.' };

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    if (startDate > endDate) {
      return { error: 'End date cannot be before start date.' };
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId, applicantId: session.userId }
    });

    if (!leave) return { error: 'Leave request not found.' };
    if (leave.status !== 'PENDING') return { error: 'Only pending requests can be edited.' };

    await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        fromDate: startDate,
        toDate: endDate,
        subject,
        reason
      }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error editing leave application:', error);
    return { error: 'Failed to edit leave application.' };
  }
}
