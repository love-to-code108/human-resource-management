'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function getSubordinates() {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    // If Admin, return everyone
    if (session.isAdmin) {
      const users = await prisma.user.findMany({
        include: {
          department: true,
          designation: true,
          leaveBalances: {
            include: { leaveType: true },
            where: { year: new Date().getFullYear() }
          },
          leavesApplied: {
            include: { leaveType: true },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { name: 'asc' }
      });
      return { success: true, users, isAdmin: true };
    }

    // If not Admin, find the user's role
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.departmentId || !user?.designationId) {
      return { success: true, users: [] };
    }

    const managerNode = await prisma.hierarchyNode.findUnique({
      where: {
        departmentId_designationId: {
          departmentId: user.departmentId,
          designationId: user.designationId
        }
      }
    });

    if (!managerNode) return { success: true, users: [], isAdmin: false };

    // Fetch all nodes to do an in-memory graph traversal (much faster than repeated DB queries)
    const allNodes = await prisma.hierarchyNode.findMany({
      include: { parents: true }
    });
    const descendantNodes = [];
    
    // Breadth-First Search (BFS) to find all descendant nodes
    let queue = [managerNode.id];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = allNodes.filter(n => n.parents?.some(p => p.id === currentId));
      for (const child of children) {
        descendantNodes.push(child);
        queue.push(child.id);
      }
    }

    if (descendantNodes.length === 0) {
      return { success: true, users: [], isAdmin: false };
    }

    // Map descendants to Prisma OR conditions
    const OR_conditions = descendantNodes.map(node => ({
      departmentId: node.departmentId,
      designationId: node.designationId
    }));

    const subordinateUsers = await prisma.user.findMany({
      where: {
        OR: OR_conditions
      },
      include: {
        department: true,
        designation: true,
        leaveBalances: {
          include: { leaveType: true },
          where: { year: new Date().getFullYear() }
        },
        leavesApplied: {
          include: { leaveType: true },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return { success: true, users: subordinateUsers, isAdmin: false };
  } catch (error) {
    console.error('Error fetching subordinates:', error);
    return { error: 'Failed to fetch subordinates.' };
  }
}

export async function deleteUser(userId) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized. Admin access required.' };

    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToDelete) return { error: 'User not found.' };
    
    if (userToDelete.isAdmin) {
      return { error: 'Cannot delete an Admin user.' };
    }

    await prisma.user.delete({ where: { id: userId } });

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error: 'Failed to delete user.' };
  }
}

export async function editUser(userId, data) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized. Admin access required.' };

    const { name, email, password, departmentId, designationId } = data;

    const userToEdit = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToEdit) return { error: 'User not found.' };

    if (userToEdit.isAdmin) {
      return { error: 'Cannot edit an Admin user.' };
    }

    // Update basic info
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        password,
        departmentId,
        designationId
      }
    });

    // If designation changed, recalculate leave balances
    if (userToEdit.designationId !== designationId) {
      const activeLeaveTypes = await prisma.leaveType.findMany({ 
        where: { isActive: true },
        include: { allocations: true }
      });
      const currentYear = new Date().getFullYear();

      for (const lt of activeLeaveTypes) {
        const override = lt.allocations?.find(a => a.designationId === designationId);
        const finalDays = override ? override.allocatedDays : lt.defaultDays;

        const existingBalance = await prisma.leaveBalance.findFirst({
          where: {
            userId: userId,
            leaveTypeId: lt.id,
            year: currentYear
          }
        });

        if (existingBalance) {
          await prisma.leaveBalance.update({
            where: { id: existingBalance.id },
            data: { totalDays: finalDays }
          });
        } else {
          await prisma.leaveBalance.create({
            data: {
              userId: userId,
              leaveTypeId: lt.id,
              year: currentYear,
              totalDays: finalDays,
              usedDays: 0
            }
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error editing user:', error);
    return { error: 'Failed to edit user. Check if email is already in use.' };
  }
}

export async function updateUserLeaveBalance(userId, leaveTypeId, newTotalDays) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized. Admin access required.' };

    const currentYear = new Date().getFullYear();

    // Check if the balance already exists
    const existingBalance = await prisma.leaveBalance.findFirst({
      where: {
        userId: userId,
        leaveTypeId: leaveTypeId,
        year: currentYear
      }
    });

    if (existingBalance) {
      await prisma.leaveBalance.update({
        where: { id: existingBalance.id },
        data: { totalDays: newTotalDays }
      });
    } else {
      await prisma.leaveBalance.create({
        data: {
          userId: userId,
          leaveTypeId: leaveTypeId,
          year: currentYear,
          totalDays: newTotalDays,
          usedDays: 0
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user leave balance:', error);
    return { error: 'Failed to update user leave balance.' };
  }
}

export async function getTeamLeaveHistory() {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    let subIds = [];
    
    if (session.isAdmin) {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      subIds = allUsers.map(u => u.id);
    } else {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user?.departmentId || !user?.designationId) {
        return { success: true, leaves: [] };
      }

      const managerNode = await prisma.hierarchyNode.findUnique({
        where: {
          departmentId_designationId: {
            departmentId: user.departmentId,
            designationId: user.designationId
          }
        }
      });

      if (!managerNode) return { success: true, leaves: [] };

      const allNodes = await prisma.hierarchyNode.findMany({
        include: { parents: true }
      });
      
      const descendantNodes = [];
      let queue = [managerNode.id];
      while (queue.length > 0) {
        const currentId = queue.shift();
        const children = allNodes.filter(n => n.parents?.some(p => p.id === currentId));
        for (const child of children) {
          descendantNodes.push(child);
          queue.push(child.id);
        }
      }

      if (descendantNodes.length === 0) {
        return { success: true, leaves: [] };
      }

      const OR_conditions = descendantNodes.map(node => ({
        departmentId: node.departmentId,
        designationId: node.designationId
      }));

      const subordinateUsers = await prisma.user.findMany({
        where: { OR: OR_conditions },
        select: { id: true }
      });
      subIds = subordinateUsers.map(u => u.id);
    }

    if (subIds.length === 0) {
      return { success: true, leaves: [] };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        applicantId: { in: subIds }
      },
      include: {
        applicant: {
          include: {
            designation: true,
            department: true,
            leaveBalances: {
              where: { year: new Date().getFullYear() },
            }
          }
        },
        leaveType: true,
        pendingAtNodes: {
          include: {
            designation: true,
            department: true
          }
        },
        auditLogs: {
          include: {
            actor: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const { getApprovalChainForUser } = await import('./hierarchy');
    const leavesWithChain = await Promise.all(leaves.map(async (leave) => {
      const chainRes = await getApprovalChainForUser(leave.applicantId);
      return {
        ...leave,
        approvalChain: chainRes.success ? chainRes.chain : []
      };
    }));

    return { success: true, leaves: leavesWithChain, isAdmin: session.isAdmin };
  } catch (error) {
    console.error('Error fetching team leave history:', error);
    return { error: 'Failed to fetch team leave history.' };
  }
}

export async function adjustUserLeaveBalance(userId, leaveTypeId, amount, reason) {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated.' };
    
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount === 0) {
      return { error: 'Amount must be a non-zero number.' };
    }
    
    if (!reason || reason.trim() === '') {
      return { error: 'A justification reason is required.' };
    }

    const currentYear = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        userId_leaveTypeId_year: {
          userId,
          leaveTypeId,
          year: currentYear
        }
      }
    });

    if (!balance) {
      return { error: 'Leave balance not found for the current year.' };
    }

    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { totalDays: balance.totalDays + numericAmount }
    });

    await prisma.leaveBalanceTransaction.create({
      data: {
        userId,
        leaveTypeId,
        amount: numericAmount,
        reason,
        performedById: session.userId,
        transactionType: 'MANUAL_ADJUSTMENT',
        leaveBalanceId: balance.id
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error adjusting leave balance:', error);
    return { error: 'Failed to adjust leave balance.' };
  }
}

export async function getUserActivityTimeline(userId) {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated.' };

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { applicantId: userId },
      include: {
        leaveType: true,
        auditLogs: {
          include: { actor: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const manualTransactions = await prisma.leaveBalanceTransaction.findMany({
      where: { userId, transactionType: 'MANUAL_ADJUSTMENT' },
      include: {
        leaveType: true,
        performedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, leaveRequests, manualTransactions };
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return { error: 'Failed to fetch timeline.' };
  }
}

export async function resetAllLeaveBalances() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized. Admin access required.' };

    const currentYear = new Date().getFullYear();
    const users = await prisma.user.findMany({
      include: { designation: true }
    });
    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
      include: { allocations: true }
    });

    for (const user of users) {
      for (const leaveType of leaveTypes) {
        let allocatedDays = leaveType.defaultDays;
        if (user.designationId) {
          const allocation = leaveType.allocations.find(a => a.designationId === user.designationId);
          if (allocation) {
            allocatedDays = allocation.allocatedDays;
          }
        }

        const balance = await prisma.leaveBalance.upsert({
          where: {
            userId_leaveTypeId_year: {
              userId: user.id,
              leaveTypeId: leaveType.id,
              year: currentYear
            }
          },
          update: {
            totalDays: allocatedDays,
            usedDays: 0
          },
          create: {
            userId: user.id,
            leaveTypeId: leaveType.id,
            year: currentYear,
            totalDays: allocatedDays,
            usedDays: 0
          }
        });

        await prisma.leaveBalanceTransaction.create({
          data: {
            userId: user.id,
            leaveTypeId: leaveType.id,
            amount: allocatedDays,
            reason: 'System Reset of all leave balances',
            performedById: session.userId,
            transactionType: 'MANUAL_ADJUSTMENT',
            leaveBalanceId: balance.id
          }
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error resetting leave balances:', error);
    return { error: 'Failed to reset leave balances.' };
  }
}

export async function getUserByEmail(email) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized.' };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: 'User not found.' };
    return { success: true, user };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return { error: 'Failed to fetch user.' };
  }
}
