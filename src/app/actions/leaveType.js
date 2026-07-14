'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

export async function getLeaveTypes() {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        allocations: {
          include: {
            designation: true
          }
        }
      }
    });
    return { success: true, leaveTypes };
  } catch (error) {
    console.error('Error fetching leave types:', error);
    return { success: false, error: 'Failed to fetch leave types' };
  }
}

export async function addLeaveType(name, defaultDays, overrides = []) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { success: false, error: 'Unauthorized' };

    const newLeaveType = await prisma.leaveType.create({
      data: { 
        name, 
        defaultDays: parseInt(defaultDays),
        allocations: {
          create: overrides.map(o => ({
            designationId: o.designationId,
            allocatedDays: parseInt(o.allocatedDays)
          }))
        }
      },
      include: {
        allocations: {
          include: {
            designation: true
          }
        }
      }
    });

    // Propagate Leave Balances to all existing users
    const currentYear = new Date().getFullYear();
    const allUsers = await prisma.user.findMany({ select: { id: true, designationId: true } });
    const balanceData = allUsers.map(user => {
      const override = overrides.find(o => o.designationId === user.designationId);
      const totalDays = override ? parseInt(override.allocatedDays) : parseInt(defaultDays);
      return {
        userId: user.id,
        leaveTypeId: newLeaveType.id,
        year: currentYear,
        totalDays,
        usedDays: 0
      };
    });

    if (balanceData.length > 0) {
      await prisma.leaveBalance.createMany({ data: balanceData });
    }
    revalidatePath('/'); 
    return { success: true, leaveType: newLeaveType };
  } catch (error) {
    console.error('Error adding leave type:', error);
    return { success: false, error: 'Failed to add leave type' };
  }
}

export async function updateLeaveType(id, name, defaultDays, overrides = []) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { success: false, error: 'Unauthorized' };

    // 1. Delete all existing overrides for this leave type
    await prisma.leaveAllocationRule.deleteMany({
      where: { leaveTypeId: id }
    });

    // 2. Update the leave type and recreate overrides
    const updatedLeaveType = await prisma.leaveType.update({
      where: { id },
      data: { 
        name, 
        defaultDays: parseInt(defaultDays),
        allocations: {
          create: overrides.map(o => ({
            designationId: o.designationId,
            allocatedDays: parseInt(o.allocatedDays)
          }))
        }
      },
      include: {
        allocations: {
          include: {
            designation: true
          }
        }
      }
    });

    // 3. Retroactively update all existing user balances for this year
    const currentYear = new Date().getFullYear();

    // Reset everyone to the new default first
    await prisma.leaveBalance.updateMany({
      where: { leaveTypeId: id, year: currentYear },
      data: { totalDays: parseInt(defaultDays) }
    });

    // Apply the specific overrides
    for (const override of overrides) {
      const usersWithDesig = await prisma.user.findMany({
        where: { designationId: override.designationId },
        select: { id: true }
      });
      
      if (usersWithDesig.length > 0) {
        const userIds = usersWithDesig.map(u => u.id);
        await prisma.leaveBalance.updateMany({
          where: { 
            leaveTypeId: id, 
            year: currentYear,
            userId: { in: userIds }
          },
          data: { totalDays: parseInt(override.allocatedDays) }
        });
      }
    }
    revalidatePath('/');
    return { success: true, leaveType: updatedLeaveType };
  } catch (error) {
    console.error('Error updating leave type:', error);
    return { success: false, error: 'Failed to update leave type' };
  }
}

export async function deleteLeaveType(id) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { success: false, error: 'Unauthorized' };

    await prisma.leaveType.delete({
      where: { id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting leave type:', error);
    return { success: false, error: 'Failed to delete leave type' };
  }
}
