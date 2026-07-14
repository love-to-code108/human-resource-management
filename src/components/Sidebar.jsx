'use client';

import { useDashboardStore } from '@/store/dashboardStore';
import { 
  LayoutDashboard, Plus, Users, Building2, Briefcase, 
  CalendarClock, Activity, Map, Settings, LogOut, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddUserDialog } from '@/components/AddUserDialog';
import { AddDesignationDialog } from '@/components/AddDesignationDialog';
import { AddDepartmentDialog } from '@/components/AddDepartmentDialog';
import { AddLeaveTypeDialog } from '@/components/AddLeaveTypeDialog';

export function Sidebar() {
  const activeView = useDashboardStore((state) => state.activeView);
  const setActiveView = useDashboardStore((state) => state.setActiveView);

  const NavItem = ({ viewId, icon: Icon, label }) => {
    const isActive = activeView === viewId;
    return (
      <button
        onClick={() => setActiveView(viewId)}
        className={cn(
          "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all text-left",
          isActive 
            ? "bg-muted text-primary font-semibold" 
            : "text-muted-foreground hover:text-primary hover:bg-muted/50"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    );
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      {/* 1. Header Section */}
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <HoverCard>
          <HoverCardTrigger asChild>
            <button 
              onClick={() => setActiveView('overview')}
              className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity"
            >
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">U</span>
              </div>
              <span className="text-lg">University ELMS</span>
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">University ELMS</h4>
                <p className="text-sm">
                  Employee Leave Management System (Admin Portal)
                </p>
                <div className="flex items-center pt-2">
                  <Info className="mr-2 h-4 w-4 opacity-70" />{" "}
                  <span className="text-xs text-muted-foreground">
                    Version 1.0.0
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* 2. Body Section */}
      <div className="flex-1 flex flex-col overflow-auto py-4">
        
        {/* Section 1: Leave Applications */}
        <div className="px-3 lg:px-4 mb-6">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Leave Applications
          </h3>
          <div className="space-y-1">
            <NavItem viewId="new-leave" icon={Plus} label="New Leave Application" />
            <NavItem viewId="my-status" icon={Activity} label="My Applications Status" />
          </div>
        </div>

        {/* Section 2: Administration (Actions) */}
        <div className="px-3 lg:px-4 mb-6">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Administration
          </h3>
          <div className="space-y-1">
            <AddUserDialog 
              trigger={
                <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all text-left">
                  <Users className="h-4 w-4" />
                  Add New User
                </button>
              }
            />
            <AddDesignationDialog 
              trigger={
                <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all text-left">
                  <Briefcase className="h-4 w-4" />
                  Add Designation
                </button>
              }
            />
            <AddDepartmentDialog 
              trigger={
                <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all text-left">
                  <Building2 className="h-4 w-4" />
                  Add Department
                </button>
              }
            />
            <AddLeaveTypeDialog 
              trigger={
                <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all text-left">
                  <CalendarClock className="h-4 w-4" />
                  Add Leave Type
                </button>
              }
            />
            <NavItem viewId="hierarchy" icon={Map} label="Hierarchy" />
          </div>
        </div>

        {/* Section 3: Approvals */}
        <div className="px-3 lg:px-4 mb-6">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Approvals
          </h3>
          <div className="space-y-1">
            <NavItem viewId="leave-management" icon={CalendarClock} label="Leave Management" />
            <NavItem viewId="user-management" icon={Users} label="User Management" />
          </div>
        </div>
        
      </div>

      {/* 3. Footer Section */}
      <div className="mt-auto border-t p-4 flex flex-col gap-4">
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-muted/50 transition-colors text-left">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src="" alt="Admin" />
                <AvatarFallback className="bg-indigo-500 text-white font-semibold">AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">Admin User</span>
                <span className="text-xs text-muted-foreground truncate">admin@university.edu</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Placeholder Option</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
