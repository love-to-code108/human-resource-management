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
      return { success: true, users };
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

    if (!managerNode) return { success: true, users: [] };

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
      return { success: true, users: [] };
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

    return { success: true, users: subordinateUsers };
  } catch (error) {
    console.error('Error fetching subordinates:', error);
    return { error: 'Failed to fetch subordinates.' };
  }
}
