'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

export async function createUser(formData) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return { error: 'Unauthorized. Only admins can create users.' };
  }

  const name = formData.get('name');
  const email = formData.get('email');
  const departmentId = formData.get('departmentId');
  const designationId = formData.get('designationId');

  if (!name || !email) {
    return { error: 'Name and email are required.' };
  }

  try {
    const password = 'Welcome123!';
    
    await prisma.user.create({
      data: {
        name,
        email,
        password,
        ...(departmentId && !departmentId.startsWith('dummy') && { departmentId }),
        ...(designationId && !designationId.startsWith('dummy') && { designationId }),
      },
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create user. Email may already exist.' };
  }
}
