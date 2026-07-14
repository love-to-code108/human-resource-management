'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    revalidatePath('/'); 
    return { success: true, leaveType: newLeaveType };
  } catch (error) {
    console.error('Error adding leave type:', error);
    return { success: false, error: 'Failed to add leave type' };
  }
}

export async function updateLeaveType(id, name, defaultDays, overrides = []) {
  try {
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
    revalidatePath('/');
    return { success: true, leaveType: updatedLeaveType };
  } catch (error) {
    console.error('Error updating leave type:', error);
    return { success: false, error: 'Failed to update leave type' };
  }
}

export async function deleteLeaveType(id) {
  try {
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
