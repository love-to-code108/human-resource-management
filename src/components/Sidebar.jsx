'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AddUserDialog } from '@/components/AddUserDialog';
import { AddDesignationDialog } from '@/components/AddDesignationDialog';
import { AddDepartmentDialog } from '@/components/AddDepartmentDialog';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">Leaveflow</span>
        </Link>
      </div>
      <div className="flex-1 flex flex-col overflow-auto">
        <nav className="grid items-start px-2 py-4 text-sm font-medium lg:px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = 
              item.href === '/dashboard' 
                ? pathname === '/dashboard' 
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive ? "bg-muted text-primary font-semibold" : ""
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-4 px-4 lg:px-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</h3>
          <div className="space-y-1 -mx-2 lg:-mx-3">
            <AddUserDialog 
              trigger={
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary font-normal">
                  <Plus className="h-4 w-4" />
                  Add New User
                </Button>
              }
            />
            <AddDesignationDialog 
              trigger={
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary font-normal">
                  <Plus className="h-4 w-4" />
                  Add Designation
                </Button>
              }
            />
            <AddDepartmentDialog 
              trigger={
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary font-normal">
                  <Plus className="h-4 w-4" />
                  Add Department
                </Button>
              }
            />
          </div>
        </div>
      </div>
      <div className="mt-auto border-t p-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
