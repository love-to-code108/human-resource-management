'use server'

import { redirect } from 'next/navigation';
import { compare } from 'bcryptjs';
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

  const isValidPassword = await compare(password, user.passwordHash);

  if (!isValidPassword) {
    return { message: 'Invalid email or password' };
  }

  await createSession(user.id, user.designationId, user.departmentId);

  redirect('/dashboard');
}
