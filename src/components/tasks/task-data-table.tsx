
"use client";

import type { Task, TaskPriority, TaskStatus, User } from "@/lib/types";
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, Filter, ListFilter, ArrowUp, Minus, ArrowDown, CalendarDays, Paperclip } from "lucide-react";
import { TaskActions } from "./task-actions";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from '@/contexts/auth-context';

interface TaskDataTableProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

type SortConfig = {
  key: keyof Task | null;
  direction: 'ascending' | 'descending';
};

const PriorityIcon = ({ priority }: { priority: TaskPriority }) => {
  switch (priority) {
    case 'high': return <ArrowUp className="h-4 w-4 text-red-500 inline-block mr-1" />;
    case 'medium': return <Minus className="h-4 w-4 text-yellow-500 inline-block mr-1" />;
    case 'low': return <ArrowDown className="h-4 w-4 text-green-500 inline-block mr-1" />;
    default: return null;
  }
};

export function TaskDataTable({ tasks, onEditTask }: TaskDataTableProps) {
  const { assignableUsers } = useAuth();
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });
  
  const [statusFilters, setStatusFilters] = useState<Set<TaskStatus>>(new Set());
  const [priorityFilters, setPriorityFilters] = useState<Set<TaskPriority>>(new Set());

  const filteredTasks = useMemo(() => {
    let SorterdTasks = [...tasks];

    if (filter) {
      SorterdTasks = SorterdTasks.filter(task =>
        task.title.toLowerCase().includes(filter.toLowerCase()) ||
        task.description?.toLowerCase().includes(filter.toLowerCase()) ||
        task.category?.toLowerCase().includes(filter.toLowerCase()) ||
        (task.assignedTo && assignableUsers.find(u => u.id === task.assignedTo)?.name?.toLowerCase().includes(filter.toLowerCase())) ||
        (task.assignedTo && assignableUsers.find(u => u.id === task.assignedTo)?.email?.toLowerCase().includes(filter.toLowerCase()))
      );
    }

    if (statusFilters.size > 0) {
      SorterdTasks = SorterdTasks.filter(task => statusFilters.has(task.status));
    }
    if (priorityFilters.size > 0) {
      SorterdTasks = SorterdTasks.filter(task => priorityFilters.has(task.priority));
    }

    if (sortConfig.key) {
      SorterdTasks.sort((a, b) => {
        let aValue = a[sortConfig.key!];
        let bValue = b[sortConfig.key!];

        if (sortConfig.key === 'assignedTo') {
          const userA = assignableUsers.find(u => u.id === a.assignedTo)?.name || '';
          const userB = assignableUsers.find(u => u.id === b.assignedTo)?.name || '';
          aValue = userA;
          bValue = userB;
        }
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else { 
           comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return SorterdTasks;
  }, [tasks, filter, sortConfig, statusFilters, priorityFilters, assignableUsers]);

  const requestSort = (key: keyof Task | 'assignedTo') => { // Allow 'assignedTo' for sorting
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: key as keyof Task, direction });
  };

  const getSortIndicator = (key: keyof Task | 'assignedTo') => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4 inline" /> : <ArrowDown className="ml-2 h-4 w-4 inline" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 inline opacity-50" />;
  };
  
  const toggleStatusFilter = (status: TaskStatus) => {
    setStatusFilters(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const togglePriorityFilter = (priority: TaskPriority) => {
    setPriorityFilters(prev => {
      const next = new Set(prev);
      if (next.has(priority)) next.delete(priority);
      else next.add(priority);
      return next;
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter tasks..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <ListFilter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TASK_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.value}
                checked={statusFilters.has(status.value)}
                onCheckedChange={() => toggleStatusFilter(status.value)}
              >
                {status.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TASK_PRIORITIES.map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority.value}
                checked={priorityFilters.has(priority.value)}
                onCheckedChange={() => togglePriorityFilter(priority.value)}
              >
                {priority.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort('title')} className="cursor-pointer hover:bg-muted/50">
                Title {getSortIndicator('title')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead onClick={() => requestSort('status')} className="cursor-pointer hover:bg-muted/50">
                Status {getSortIndicator('status')}
              </TableHead>
              <TableHead onClick={() => requestSort('priority')} className="cursor-pointer hover:bg-muted/50">
                Priority {getSortIndicator('priority')}
              </TableHead>
              <TableHead onClick={() => requestSort('dueDate')} className="cursor-pointer hover:bg-muted/50">
                Due Date {getSortIndicator('dueDate')}
              </TableHead>
              <TableHead onClick={() => requestSort('category')} className="cursor-pointer hover:bg-muted/50">
                Category {getSortIndicator('category')}
              </TableHead>
              <TableHead onClick={() => requestSort('assignedTo')} className="cursor-pointer hover:bg-muted/50">
                Assigned To {getSortIndicator('assignedTo')}
              </TableHead>
              <TableHead>Files</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const assignedUser = task.assignedTo ? assignableUsers.find(u => u.id === task.assignedTo) : null;
                return (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{task.description}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        task.status === 'done' ? 'default' 
                        : task.status === 'inprogress' ? 'secondary' 
                        : 'outline'
                      }
                    >
                      {TASK_STATUSES.find(s => s.value === task.status)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <Badge variant={
                        task.priority === 'high' ? 'destructive' 
                        : task.priority === 'medium' ? 'secondary' 
                        : 'outline'
                      }
                      className="capitalize"
                     >
                        <PriorityIcon priority={task.priority} />
                        {task.priority}
                      </Badge>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? 
                      <span className="flex items-center text-sm">
                        <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span> : 
                      <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>{task.category || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell>
                    {assignedUser ? (
                       <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7 text-xs">
                                  <AvatarFallback>{getInitials(assignedUser.name || assignedUser.email)}</AvatarFallback>
                                </Avatar>
                                <span className="hidden lg:inline text-sm">{assignedUser.name || assignedUser.email}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{assignedUser.name || assignedUser.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.files && task.files.length > 0 ? (
                      <div className="flex items-center text-sm">
                        <Paperclip className="h-4 w-4 mr-1 text-muted-foreground" />
                        {task.files.length}
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <TaskActions task={task} onEdit={onEditTask} />
                  </TableCell>
                </TableRow>
              )})
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="rounded-lg border bg-card text-card-foreground shadow-sm" {...props} />;
}
