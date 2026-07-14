'use client';

import React, { useState } from 'react';
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
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

  const handleLogout = async () => {
    setActiveView('my-status');
    await logoutAction();
    router.push('/login');
  };

  // Reusable component for navigation links
  const SidebarItem = React.forwardRef(({ icon: Icon, label, isActive, onClick, className, ...props }, ref) => (
    <button
      ref={ref}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (props.onClick) props.onClick(e);
      }}
      className={cn(
        "w-full flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors text-left",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        className
      )}
      {...props}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
      <span className="truncate">{label}</span>
    </button>
  ));
  SidebarItem.displayName = "SidebarItem";

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
      <div className="shrink-0 border-b p-4">
        <HoverCard>
          <HoverCardTrigger render={
            <div className="flex w-full items-center gap-3 outline-none cursor-default">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <GalleryVerticalEnd className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start flex-1 overflow-hidden">
                <span className="text-sm font-semibold truncate text-foreground leading-tight">LeaveFlow</span>
                <span className="text-[11px] text-muted-foreground truncate mt-0.5">Enterprise</span>
              </div>
            </div>
          } />
          <HoverCardContent align="start" className="w-64" side="bottom" sideOffset={8}>
            <div className="flex flex-col space-y-1">
              <h4 className="text-sm font-semibold">LeaveFlow Enterprise</h4>
              <p className="text-xs text-muted-foreground">Internal Human Resource Management portal.</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* 2. Body Section */}
      <div className="flex-1 flex flex-col overflow-y-auto py-6 gap-3">

        {/* Section 1: Leave Applications */}
        <div className="px-3 lg:px-4">
          <h3 className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            My Leaves
          </h3>
          <div className="flex flex-col gap-1 w-full">
            <NavItem viewId="new-leave" icon={FileText} label="Apply for Leave" />
            <NavItem viewId="my-status" icon={ListTodo} label="Application Status" />
          </div>
        </div>

        {isAdmin && <div className="h-px bg-border my-3 mx-6 opacity-50" />}

        {/* Section 2: Administration (Actions) */}
        {isAdmin && (
          <div className="px-3 lg:px-4">
            <h3 className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Administration
            </h3>
            <div className="flex flex-col gap-1 w-full">
              <AddUserDialog trigger={<SidebarItem icon={UserPlus} label="Add New User" />} />
              <AddDesignationDialog trigger={<SidebarItem icon={Briefcase} label="Add Designation" />} />
              <AddDepartmentDialog trigger={<SidebarItem icon={Building2} label="Add Department" />} />
              <AddLeaveTypeDialog trigger={<SidebarItem icon={CalendarPlus} label="Add Leave Type" />} />
              <NavItem viewId="hierarchy" icon={Network} label="Hierarchy Mapper" />
            </div>
          </div>
        )}

        {(isAdmin || isManager) && <div className="h-px bg-border my-3 mx-6 opacity-50" />}

        {/* Section 3: Approvals */}
        {(isAdmin || isManager) && (
          <div className="px-3 lg:px-4 mb-2">
            <h3 className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Approvals & Team
            </h3>
            <div className="flex flex-col gap-1 w-full">
              <NavItem viewId="leave-management" icon={CheckSquare} label="Leave Approvals" />
              <NavItem viewId="user-management" icon={Users} label="User Management" />
            </div>
          </div>
        )}

      </div>

      {/* 3. Footer Section */}
      <div className="mt-auto border-t p-2 w-full">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="w-full flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors text-left outline-none">
              <Avatar className="h-9 w-9 shrink-0 rounded-full">
                <AvatarFallback className="bg-purple-600 text-white text-xs font-bold rounded-full">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-semibold truncate text-foreground leading-tight">{userName}</span>
                <span className="text-[11px] text-muted-foreground truncate mt-0.5">{userEmail}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
            </button>
          } />
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
