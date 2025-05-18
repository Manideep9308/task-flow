
"use client"; // Required for useEffect and useRouter

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TaskProvider } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login' && pathname !== '/signup') {
      router.replace('/login');
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user && pathname !== '/login' && pathname !== '/signup') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TaskProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AppSidebar />
          <div className="flex flex-col flex-1 print:pl-0 md:peer-data-[state=expanded]:pl-[var(--sidebar-width)] md:peer-data-[state=collapsed]:pl-[var(--sidebar-width-icon)] transition-[padding-left] duration-200 ease-linear">
            <AppHeader /> {/* Sticky, h-16 (4rem), z-30 */}
            
            {/* Main content area: pt-16 to offset header, overflow-y-auto for scrolling */}
            <main className="flex-1 pt-16 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TaskProvider>
  );
}
