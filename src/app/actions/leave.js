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

    const { leaveTypeId, fromDate, toDate, reason } = data;

    if (!leaveTypeId || !fromDate || !toDate || !reason) {
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
      }
    });

    if (!userNode) {
      return { error: 'Your role is not mapped in the Hierarchy Graph. Please ask an Admin to map your Role.' };
    }

    const pendingAtNodeId = userNode.parentId;
    let status = 'PENDING';

    // If they have no manager (e.g. they are the top of the chain), auto-approve.
    if (!pendingAtNodeId) {
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
        reason,
        status,
        pendingAtNodeId: pendingAtNodeId || null,
      }
    });

    revalidatePath('/dashboard');
    return { success: true };

  } catch (error) {
    console.error('Error submitting leave:', error);
    return { error: 'An unexpected error occurred while submitting.' };
  }
}
