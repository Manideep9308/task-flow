
"use client"; // Required for useEffect and useRouter

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TaskProvider } from "@/contexts/task-context";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

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
          <div className="flex flex-col print:pl-0 md:peer-data-[state=expanded]:pl-[var(--sidebar-width)] md:peer-data-[state=collapsed]:pl-[var(--sidebar-width-icon)] transition-[padding-left] duration-200 ease-linear">
            <AppHeader /> {/* Sticky, h-16 (4rem), z-30 */}
            
            {/* This div is the main scrollable area below the header */}
            <div className="relative flex-1 pt-16 overflow-y-auto"> {/* pt-16 for AppHeader height */}
              
              {/* Background Logo Area */}
              <div className="absolute inset-x-0 top-0 h-40 z-0 flex items-center justify-center pointer-events-none">
                <Image
                  src="https://placehold.co/300x100.png" // Placeholder for logo
                  alt="Background Logo"
                  width={200} 
                  height={66} 
                  className="opacity-20" // Adjust opacity as needed
                  data-ai-hint="company brand"
                />
              </div>

              {/* Main Content - starts below the logo area */}
              <main className="relative z-10 flex-1 px-4 sm:px-6 pt-40 pb-4 sm:pb-6"> {/* pt-40 for logo area height */}
                {children}
              </main>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </TaskProvider>
  );
}
