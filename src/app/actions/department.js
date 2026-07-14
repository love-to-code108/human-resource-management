'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      // We don't have createdAt in the schema for Department right now, so we can just order by name or leave it default
      orderBy: { name: 'asc' },
    });
    return { success: true, departments };
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { success: false, error: 'Failed to fetch departments' };
  }
}

export async function addDepartment(name) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { success: false, error: 'Unauthorized' };

    const newDepartment = await prisma.department.create({
      data: { name },
    });
    revalidatePath('/'); // Adjust if there's a specific route to revalidate
    return { success: true, department: newDepartment };
  } catch (error) {
    console.error('Error adding department:', error);
    return { success: false, error: 'Failed to add department' };
  }
}

export async function updateDepartment(id, name) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { success: false, error: 'Unauthorized' };

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: { name },
    });
    revalidatePath('/');
    return { success: true, department: updatedDepartment };
  } catch (error) {
    console.error('Error updating department:', error);
    return { success: false, error: 'Failed to update department' };
  }
}

export async function deleteDepartment(id) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { success: false, error: 'Unauthorized' };

    await prisma.department.delete({
      where: { id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting department:', error);
    return { success: false, error: 'Failed to delete department' };
  }
}
