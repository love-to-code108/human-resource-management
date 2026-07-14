'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { checkSessionRoles } from '@/app/actions/auth';
import { NewLeaveApplication } from '@/components/dashboard-views/NewLeaveApplication';
import { MyApplicationsStatus } from '@/components/dashboard-views/MyApplicationsStatus';
import { Hierarchy } from '@/components/dashboard-views/Hierarchy';
import { LeaveManagement } from '@/components/dashboard-views/LeaveManagement';
import { UserManagement } from '@/components/dashboard-views/UserManagement';

export default function DashboardPage() {
  const activeView = useDashboardStore((state) => state.activeView);
  const setActiveView = useDashboardStore((state) => state.setActiveView);

  useEffect(() => {
    const verifyAccess = async () => {
      const roles = await checkSessionRoles();
      
      // Admin only views
      if (activeView === 'hierarchy' && !roles.isAdmin) {
        setActiveView('my-status');
      }
      
      // Admin or Manager views
      if ((activeView === 'leave-management' || activeView === 'user-management') && !roles.isAdmin && !roles.isManager) {
        setActiveView('my-status');
      }
    };
    verifyAccess();
  }, [activeView, setActiveView]);

  switch (activeView) {
    case 'new-leave':
      return <NewLeaveApplication />;
    case 'my-status':
      return <MyApplicationsStatus />;
    case 'hierarchy':
      return <Hierarchy />;
    case 'leave-management':
      return <LeaveManagement />;
    case 'user-management':
      return <UserManagement />;
    default:
      return <MyApplicationsStatus />;
  }
}
