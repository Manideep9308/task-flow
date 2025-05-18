
"use client";

import type { Task, TaskStatus, User } from '@/lib/types';
import { BasicTaskCard } from './task-card'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DroppableProvided } from 'react-beautiful-dnd'; // Placeholder type
// Removed assignableUsers from props, will be accessed via context in BasicTaskCard

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  provided?: DroppableProvided; 
  isDraggingOver?: boolean; 
}

export function KanbanColumn({ status, title, tasks, onTaskClick, provided, isDraggingOver }: KanbanColumnProps) {
  return (
    <Card 
      className={`flex-1 min-w-[300px] h-full flex flex-col bg-muted/50 ${isDraggingOver ? 'bg-accent/20' : ''}`}
      data-status-id={status} 
    >
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-semibold flex justify-between items-center">
          {title}
          <span className="text-sm font-normal text-muted-foreground bg-primary/10 text-primary rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent 
          className="p-4 h-full"
          ref={provided?.innerRef}
          {...provided?.droppableProps}
          onDragOver={(e) => e.preventDefault()} 
          onDrop={(e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('taskId');
            // Parent component handles drop logic
          }}
        >
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No tasks yet
            </div>
          )}
          {tasks.map((task, index) => (
            <div 
              key={task.id}
              draggable 
              onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
            >
              <BasicTaskCard
                task={task}
                onClick={() => onTaskClick(task)}
                // assignableUsers prop removed
              />
            </div>
          ))}
          {provided?.placeholder}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
