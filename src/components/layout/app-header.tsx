"use client";

import Link from 'next/link';
import { ClipboardCheck, Settings, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar'; // Assuming sidebar has a trigger, if needed here
import { AddTaskButton } from '@/components/tasks/add-task-button';

export function AppHeader() {
  // const { toggleSidebar } = useSidebar(); // If sidebar trigger is in header for mobile

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile sidebar trigger can go here if needed */}
      {/* <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
        <MenuIcon className="h-6 w-6" />
      </Button> */}
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
        <ClipboardCheck className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold">TaskFlow</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <AddTaskButton />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-6 w-6" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
