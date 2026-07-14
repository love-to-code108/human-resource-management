'use server'

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';

export async function loginAction(prevState, formData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return { message: 'Email and password are required' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { message: 'Invalid email or password' };
  }

  if (password !== user.password) {
    return { message: 'Invalid email or password' };
  }

  await createSession(user.id, user.designationId, user.departmentId, user.isAdmin);

  redirect('/dashboard');
}
