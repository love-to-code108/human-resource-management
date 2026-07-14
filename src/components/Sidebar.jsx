'use client';

import { useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import {
  Users, Building2, Briefcase, CalendarClock, Settings, LogOut, Info,
  UserPlus, CalendarPlus, Network, FileText, CheckSquare, ListTodo,
  ChevronsUpDown, ChevronRight, GalleryVerticalEnd
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { AddUserDialog } from '@/components/AddUserDialog';
import { AddDesignationDialog } from '@/components/AddDesignationDialog';
import { AddDepartmentDialog } from '@/components/AddDepartmentDialog';
import { AddLeaveTypeDialog } from '@/components/AddLeaveTypeDialog';
import { logoutAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export function Sidebar({ isAdmin, isManager, userName, userEmail }) {
  const activeView = useDashboardStore((state) => state.activeView);
  const setActiveView = useDashboardStore((state) => state.setActiveView);
  const router = useRouter();
  const [isAdministrationOpen, setIsAdministrationOpen] = useState(true);

  const handleLogout = async () => {
    setActiveView('my-status');
    await logoutAction();
    router.push('/login');
  };

  // Reusable component for navigation links
  const SidebarItem = ({ icon: Icon, label, isActive, onClick, className }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors text-left",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        className
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
      <span className="truncate">{label}</span>
    </button>
  );

  const NavItem = ({ viewId, icon, label }) => (
    <SidebarItem
      icon={icon}
      label={label}
      isActive={activeView === viewId}
      onClick={() => setActiveView(viewId)}
    />
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* 1. Header Section */}
      <div className="p-2 shrink-0">
        <button 
          onClick={() => setActiveView('my-status')}
          className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-muted transition-all outline-none"
        >
          <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <GalleryVerticalEnd className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-start flex-1 overflow-hidden">
            <span className="text-sm font-semibold truncate text-foreground leading-tight">LeaveFlow</span>
            <span className="text-[11px] text-muted-foreground truncate mt-0.5">Enterprise</span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </button>
      </div>

      {/* 2. Body Section */}
      <div className="flex-1 flex flex-col overflow-y-auto px-2 py-4 gap-6">

        {/* Section 1: Platform */}
        <div>
          <h3 className="mb-1 px-2 text-[11px] font-medium text-muted-foreground">
            Platform
          </h3>
          <div className="space-y-0.5">
            <NavItem viewId="new-leave" icon={FileText} label="Apply for Leave" />
            <NavItem viewId="my-status" icon={ListTodo} label="Application Status" />
          </div>
        </div>

        {/* Section 2: Administration (Nested) */}
        {isAdmin && (
          <div>
            <div className="space-y-0.5">
              <button
                onClick={() => setIsAdministrationOpen(!isAdministrationOpen)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors text-left",
                  isAdministrationOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Settings className={cn("h-4 w-4 shrink-0", isAdministrationOpen ? "text-foreground" : "text-muted-foreground")} />
                <span className="flex-1 truncate">Administration</span>
                <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isAdministrationOpen && "rotate-90")} />
              </button>
              
              {isAdministrationOpen && (
                <div className="pl-4 pt-1">
                  <div className="flex flex-col gap-1 border-l border-border pl-4 ml-1">
                    <AddUserDialog trigger={<button className="text-[13px] text-muted-foreground hover:text-foreground py-1 text-left w-full transition-colors">Add New User</button>} />
                    <AddDesignationDialog trigger={<button className="text-[13px] text-muted-foreground hover:text-foreground py-1 text-left w-full transition-colors">Add Designation</button>} />
                    <AddDepartmentDialog trigger={<button className="text-[13px] text-muted-foreground hover:text-foreground py-1 text-left w-full transition-colors">Add Department</button>} />
                    <AddLeaveTypeDialog trigger={<button className="text-[13px] text-muted-foreground hover:text-foreground py-1 text-left w-full transition-colors">Add Leave Type</button>} />
                    <button 
                      onClick={() => setActiveView('hierarchy')} 
                      className={cn(
                        "text-[13px] py-1 text-left w-full transition-colors", 
                        activeView === 'hierarchy' ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Hierarchy Mapper
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Approvals */}
        {(isAdmin || isManager) && (
          <div>
            <div className="space-y-0.5">
              <NavItem viewId="leave-management" icon={CheckSquare} label="Leave Approvals" />
              <NavItem viewId="user-management" icon={Users} label="User Management" />
            </div>
          </div>
        )}

      </div>

      {/* 3. Footer Section */}
      <div className="mt-auto border-t p-2 w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 rounded-md p-2 hover:bg-muted transition-colors text-left outline-none">
              <Avatar className="h-9 w-9 shrink-0 rounded-lg">
                <AvatarFallback className="bg-purple-600 text-white text-xs font-bold rounded-lg">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-semibold truncate text-foreground leading-tight">{userName}</span>
                <span className="text-[11px] text-muted-foreground truncate mt-0.5">{userEmail}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <div className="flex items-center justify-between px-2 py-1 mt-1 rounded-sm hover:bg-muted transition-colors">
                <span className="text-sm">Appearance</span>
                <ThemeToggle />
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="flex justify-between">
              <div className="flex items-center">
                <Info className="mr-2 h-4 w-4" />
                <span>Version</span>
              </div>
              <span className="text-xs text-muted-foreground">1.0.0</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
