import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TaskProvider } from "@/contexts/task-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TaskProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AppSidebar />
          <div className="flex flex-col sm:gap-4 sm:py-4 print:pl-0 md:peer-data-[state=expanded]:pl-[var(--sidebar-width)] md:peer-data-[state=collapsed]:pl-[var(--sidebar-width-icon)] transition-[padding-left] duration-200 ease-linear">
            <AppHeader />
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TaskProvider>
  );
}
