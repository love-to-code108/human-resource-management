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
    const allNodes = await prisma.hierarchyNode.findMany();
    const descendantNodes = [];
    
    // Breadth-First Search (BFS) to find all descendant nodes
    let queue = [managerNode.id];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = allNodes.filter(n => n.parentId === currentId);
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
