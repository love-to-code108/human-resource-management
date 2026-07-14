import { Sidebar } from '@/components/Sidebar';

export const metadata = {
  title: 'Dashboard | University ELMS',
  description: 'Employee Leave Management System Dashboard',
};

import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  
  let user = null;
  if (session?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true }
    });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar 
        isAdmin={session?.isAdmin} 
        isManager={session?.isManager} 
        userName={user?.name || 'User'} 
        userEmail={user?.email || ''} 
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
