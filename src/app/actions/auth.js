'use server'

import { getSession, deleteSession } from '@/lib/session';


export async function logoutAction() {
  await deleteSession();
  return { success: true };
}

export async function checkSessionRoles() {
  const session = await getSession();
  if (!session) return { isAdmin: false, isManager: false };
  return { 
    isAdmin: session.isAdmin || false, 
    isManager: session.isManager || false 
  };
}
