'use server'

import { deleteSession } from '@/lib/session';


export async function logoutAction() {
  await deleteSession();
  return { success: true };
}
