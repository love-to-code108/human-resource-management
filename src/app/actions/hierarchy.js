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

    // Prevent self-reference
    if (nodeId === parentId) {
      return { error: 'A node cannot report to itself.' };
    }

    // Optional: add a cyclic dependency check here if needed in the future
    
    await prisma.hierarchyNode.update({
      where: { id: nodeId },
      data: { parentId: parentId || null }, // null disconnects it
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating hierarchy connection:', error);
    return { error: 'Failed to update hierarchy connection' };
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
