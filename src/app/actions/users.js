'use server'

import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function createUser(formData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const departmentId = formData.get('departmentId');
  const designationId = formData.get('designationId');

  if (!name || !email) {
    return { error: 'Name and email are required.' };
  }

  try {
    const passwordHash = await hash('Welcome123!', 10);
    
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
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
