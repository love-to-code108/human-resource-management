'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

export async function getHierarchyNodes() {
  try {
    const nodes = await prisma.hierarchyNode.findMany({
      include: {
        department: true,
        designation: true,
        parents: true,
      },
    });
    return { success: true, data: nodes };
  } catch (error) {
    console.error('Error fetching hierarchy nodes:', error);
    return { error: 'Failed to fetch hierarchy nodes' };
  }
}

export async function createHierarchyNode(departmentId, designationId, x = 50, y = 50) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized. Admin access required.' };

    const existingNode = await prisma.hierarchyNode.findUnique({
      where: {
        departmentId_designationId: {
          departmentId,
          designationId,
        },
      },
    });

    if (existingNode) {
      return { error: 'A node for this Designation + Department already exists in the hierarchy.' };
    }

    const newNode = await prisma.hierarchyNode.create({
      data: {
        departmentId,
        designationId,
        x,
        y
      },
      include: {
        department: true,
        designation: true,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, data: newNode };
  } catch (error) {
    console.error('Error creating hierarchy node:', error);
    return { error: 'Failed to create hierarchy node' };
  }
}

export async function updateHierarchyConnection(nodeId, parentId) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized. Admin access required.' };

    if (nodeId === parentId) {
      return { error: 'A node cannot report to itself.' };
    }

    await prisma.hierarchyNode.update({
      where: { id: nodeId },
      data: {
        parents: {
          connect: { id: parentId }
        }
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating hierarchy connection:', error);
    return { error: 'Failed to update hierarchy connection' };
  }
}

export async function disconnectHierarchyConnection(nodeId, parentId) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized. Admin access required.' };

    await prisma.hierarchyNode.update({
      where: { id: nodeId },
      data: {
        parents: {
          disconnect: { id: parentId }
        }
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting hierarchy connection:', error);
    return { error: 'Failed to disconnect hierarchy connection' };
  }
}

export async function deleteHierarchyNode(nodeId) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized. Admin access required.' };

    // Check if it has children. If so, disconnect them or throw error.
    const node = await prisma.hierarchyNode.findUnique({
      where: { id: nodeId },
      include: { children: true }
    });

    if (node?.children?.length > 0) {
      return { error: 'Cannot delete a node that has subordinates. Disconnect the subordinates first.' };
    }

    await prisma.hierarchyNode.delete({
      where: { id: nodeId },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting hierarchy node:', error);
    return { error: 'Failed to delete hierarchy node' };
  }
}

export async function updateNodePosition(nodeId, x, y) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized. Admin access required.' };

    await prisma.hierarchyNode.update({
      where: { id: nodeId },
      data: { x, y }
    });
    // We don't revalidatePath here because it happens constantly on drag
    return { success: true };
  } catch (error) {
    console.error('Error updating node position:', error);
    return { error: 'Failed to update position' };
  }
}

export async function getApprovalChainForUser() {
  try {
    const session = await getSession();
    if (!session?.userId) return { error: 'Not authenticated' };

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.departmentId || !user?.designationId) {
      return { success: true, chain: [] };
    }

    // Fetch all nodes so we can traverse in memory (fast)
    const allNodes = await prisma.hierarchyNode.findMany({
      include: {
        department: true,
        designation: true,
        parents: true,
      }
    });

    const userNode = allNodes.find(
      n => n.departmentId === user.departmentId && n.designationId === user.designationId
    );

    if (!userNode) return { success: true, chain: [] };

    const chain = [];
    let currentLevelIds = (userNode.parents || []).map(p => p.id);
    const visited = new Set([userNode.id]);

    while (currentLevelIds.length > 0) {
      const levelNodes = currentLevelIds.map(id => allNodes.find(n => n.id === id)).filter(Boolean);
      if (levelNodes.length > 0) {
        chain.push(levelNodes);
      }
      
      const nextLevelIds = new Set();
      for (const node of levelNodes) {
        if (!visited.has(node.id)) {
          visited.add(node.id);
          for (const p of node.parents || []) {
            nextLevelIds.add(p.id);
          }
        }
      }
      currentLevelIds = Array.from(nextLevelIds);
    }

    return { success: true, chain };
  } catch (error) {
    console.error('Error fetching approval chain:', error);
    return { error: 'Failed to fetch approval chain.' };
  }
}
