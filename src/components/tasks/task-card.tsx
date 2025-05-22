
"use client";

import type { Task, TaskPriority, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUp, Minus, ArrowDown, CalendarDays, Paperclip } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import type { DraggableProvided } from 'react-beautiful-dnd'; // Placeholder type
import { useAuth } from '@/contexts/auth-context';
// Removed: import Image from 'next/image';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean; 
  provided?: DraggableProvided; 
  onClick?: () => void;
}

const PriorityIcon = ({ priority }: { priority: TaskPriority }) => {
  switch (priority) {
    case 'high':
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    case 'medium':
      return <Minus className="h-4 w-4 text-yellow-500" />;
    case 'low':
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    default:
      return null;
  }
};

// This component is not directly used in Kanban, BasicTaskCard is.
// However, keeping its structure for reference or future use.
export function TaskCard({ task, isDragging, provided, onClick }: TaskCardProps) {
  const { assignableUsers } = useAuth();
  const assignedUser = task.assignedTo ? assignableUsers.find(u => u.id === task.assignedTo) : null;

  const cardClasses = cn(
    "mb-4 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-grab",
    isDragging ? "shadow-xl rotate-3" : "",
    {
      'border-l-4 border-red-500': task.priority === 'high',
      'border-l-4 border-yellow-500': task.priority === 'medium',
      'border-l-4 border-green-500': task.priority === 'low',
    }
  );

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      onClick={onClick}
      className="mb-3"
      role="button"
      aria-label={`Task: ${task.title}`}
    >
      <Card className={cardClasses}>
        {/* Removed Image display */}
        <CardHeader className={cn("p-4")}>
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-semibold flex-1">{task.title}</CardTitle>
            {assignedUser && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-7 w-7 text-xs ml-2 shrink-0">
                      <AvatarFallback>{getInitials(assignedUser.name || assignedUser.email)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assigned to: {assignedUser.name || assignedUser.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {task.category && (
            <Badge variant="outline" className="mt-1 text-xs w-fit">{task.category}</Badge>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <CardDescription className="text-sm mb-3 line-clamp-2">{task.description}</CardDescription>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <PriorityIcon priority={task.priority} />
              <span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            {task.files && task.files.length > 0 && (
                <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    <span>{task.files.length}</span>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// BasicTaskCard is used by KanbanColumn
export function BasicTaskCard({ task, onClick }: Pick<TaskCardProps, 'task' | 'onClick'>) {
  const { assignableUsers } = useAuth();
  const assignedUser = task.assignedTo ? assignableUsers.find(u => u.id === task.assignedTo) : null;
  
  const cardClasses = cn(
    "shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-card",
    {
      'border-l-4 border-red-500': task.priority === 'high',
      'border-l-4 border-yellow-500': task.priority === 'medium',
      'border-l-4 border-green-500': task.priority === 'low',
    }
  );

  return (
    <div
      onClick={onClick}
      className="mb-3" 
      role="button"
      aria-label={`Task: ${task.title}`}
    >
      <Card className={cardClasses}>
        {/* Removed Image display */}
        <CardHeader className={cn("p-4")}>
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-semibold flex-1 line-clamp-2">{task.title}</CardTitle>
            {assignedUser && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-7 w-7 text-xs ml-2 shrink-0 border-2 border-card">
                      <AvatarFallback>{getInitials(assignedUser.name || assignedUser.email)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assigned to: {assignedUser.name || assignedUser.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {task.category && (
            <Badge variant="outline" className="mt-1 text-xs w-fit">{task.category}</Badge>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <CardDescription className="text-sm mb-3 line-clamp-2">{task.description}</CardDescription>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <PriorityIcon priority={task.priority} />
              <span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
             {task.files && task.files.length > 0 && (
                <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    <span>{task.files.length}</span>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
