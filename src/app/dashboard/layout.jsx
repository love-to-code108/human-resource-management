import { Sidebar } from '@/components/Sidebar';

export const metadata = {
  title: 'Dashboard | University ELMS',
  description: 'Employee Leave Management System Dashboard',
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
