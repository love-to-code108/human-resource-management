'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

export async function getDesignations() {
  try {
    const designations = await prisma.designation.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, designations };
  } catch (error) {
    console.error('Error fetching designations:', error);
    return { success: false, error: 'Failed to fetch designations' };
  }
}

export async function addDesignation(name) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { success: false, error: 'Unauthorized' };

    const newDesignation = await prisma.designation.create({
      data: { name },
    });
    revalidatePath('/'); // Adjust if there's a specific route to revalidate
    return { success: true, designation: newDesignation };
  } catch (error) {
    console.error('Error adding designation:', error);
    return { success: false, error: 'Failed to add designation' };
  }
}

export async function updateDesignation(id, name) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { success: false, error: 'Unauthorized' };

    const updatedDesignation = await prisma.designation.update({
      where: { id },
      data: { name },
    });
    revalidatePath('/');
    return { success: true, designation: updatedDesignation };
  } catch (error) {
    console.error('Error updating designation:', error);
    return { success: false, error: 'Failed to update designation' };
  }
}

export async function deleteDesignation(id) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { success: false, error: 'Unauthorized' };

    await prisma.designation.delete({
      where: { id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting designation:', error);
    return { success: false, error: 'Failed to delete designation' };
  }
}
