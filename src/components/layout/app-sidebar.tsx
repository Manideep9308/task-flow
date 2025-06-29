
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
} from '@/components/ui/sidebar';
import {
    ClipboardCheck,
    LayoutDashboard,
    ListChecks,
    FileArchive,
    ScrollText,
    Settings,
    LogOut,
    CalendarDays,
    ShieldCheck,
    MessageSquareText,
    MessagesSquare,
    BarChart3,
    Clock,
    Lightbulb,
    HelpCircle, 
    DraftingCompass, // Added for Project Scoper
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Task List', icon: ListChecks },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/files', label: 'Files', icon: FileArchive },
  { href: '/summary', label: 'Summary', icon: ScrollText },
  { href: '/standup-history', label: 'Standups', icon: MessageSquareText },
  { href: '/time-travel', label: 'Time Travel', icon: Clock },
  { href: '/team-chat', label: 'Team Chat', icon: MessagesSquare },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/idea-validator', label: 'Idea Validator', icon: Lightbulb },
  { href: '/project-scoping', label: 'Project Scoper', icon: DraftingCompass }, // New Item
];

const adminNavItems = [
  { href: '/admin', label: 'Admin Panel', icon: ShieldCheck, role: 'admin' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getAvailableNavItems = () => {
    let items = [...navItems];
    if (user?.role === 'admin') {
      // Find a logical place to insert admin items, e.g., after core features
      const reportsIndex = items.findIndex(item => item.href === '/reports'); // Example insertion point
      if (reportsIndex !== -1 && reportsIndex < items.length -1) {
        items.splice(reportsIndex + 1, 0, ...adminNavItems);
      } else { // Fallback: add to end if reference point not found or is last
        items = [...items, ...adminNavItems];
      }
    }
    // Sort items to ensure consistent order, e.g., alphabetically or by a predefined order
    // For now, keeping the order as defined, with admin items inserted.
    return items;
  };
  
  const availableNavItems = getAvailableNavItems();


  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="hidden md:flex items-center justify-center gap-2 p-2 group-data-[state=collapsed]:hidden">
           <ClipboardCheck className="h-8 w-8 text-primary" />
           <span className="text-2xl font-bold">IntelliTrack</span>
        </div>
         <div className="hidden md:flex items-center justify-center group-data-[state=expanded]:hidden py-2">
            <ClipboardCheck className="h-8 w-8 text-primary" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {availableNavItems.map((item) => (
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
      {user && (
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
              <SidebarMenuButton onClick={logout} tooltip={{ children: "Logout", className: "ml-2" }}>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
