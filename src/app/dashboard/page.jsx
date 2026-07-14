'use client';

import { useDashboardStore } from '@/store/dashboardStore';
import { NewLeaveApplication } from '@/components/dashboard-views/NewLeaveApplication';
import { MyApplicationsStatus } from '@/components/dashboard-views/MyApplicationsStatus';
import { Hierarchy } from '@/components/dashboard-views/Hierarchy';
import { LeaveManagement } from '@/components/dashboard-views/LeaveManagement';
import { UserManagement } from '@/components/dashboard-views/UserManagement';

export default function DashboardPage() {
  const activeView = useDashboardStore((state) => state.activeView);

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
