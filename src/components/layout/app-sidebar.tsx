"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, LayoutDashboard, ListChecks, FileArchive, ScrollText, Settings, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Task List', icon: ListChecks },
  { href: '/files', label: 'Files', icon: FileArchive },
  { href: '/summary', label: 'Summary', icon: ScrollText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        {/* Mobile trigger for sidebar is part of ui/sidebar, if needed could be controlled via context from header */}
        {/* <div className="flex items-center justify-between md:hidden">
           <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <span>TaskFlow</span>
          </Link>
          <SidebarTrigger />
        </div> */}
        <div className="hidden md:flex items-center justify-center gap-2 p-2 group-data-[state=collapsed]:hidden">
           <ClipboardCheck className="h-8 w-8 text-primary" />
           <span className="text-2xl font-bold">TaskFlow</span>
        </div>
         <div className="hidden md:flex items-center justify-center group-data-[state=expanded]:hidden py-2">
            <ClipboardCheck className="h-8 w-8 text-primary" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                tooltip={{ children: item.label, className: "ml-2" }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={{ children: "Settings", className: "ml-2" }}>
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={{ children: "Logout", className: "ml-2" }}>
              <Link href="#">
                <LogOut />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
