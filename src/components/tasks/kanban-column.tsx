"use client";

import type { Task, TaskStatus } from '@/lib/types';
import { BasicTaskCard } from './task-card'; // Using BasicTaskCard as react-beautiful-dnd is not installed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DroppableProvided } from 'react-beautiful-dnd'; // Placeholder type

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  provided?: DroppableProvided; // For react-beautiful-dnd
  isDraggingOver?: boolean; // For react-beautiful-dnd styling
}

export function KanbanColumn({ status, title, tasks, onTaskClick, provided, isDraggingOver }: KanbanColumnProps) {
  return (
    <Card 
      className={`flex-1 min-w-[300px] h-full flex flex-col bg-muted/50 ${isDraggingOver ? 'bg-accent/20' : ''}`}
      // Using status as part of a data attribute for native D&D
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
          // For native D&D
          onDragOver={(e) => e.preventDefault()} // Allow drop
          onDrop={(e) => {
            e.preventDefault();
            // Native D&D logic would be handled in parent component
            // For example, by retrieving dataTransfer data
            const taskId = e.dataTransfer.getData('taskId');
            if (taskId) {
              // Call a handler from props or context
              // onDropTask(taskId, status, tasks.length); 
            }
          }}
        >
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No tasks yet
            </div>
          )}
          {tasks.map((task, index) => (
            // For react-beautiful-dnd, Draggable would wrap BasicTaskCard
            // For native D&D
            <div 
              key={task.id}
              draggable 
              onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
            >
              <BasicTaskCard
                task={task}
                onClick={() => onTaskClick(task)}
              />
            </div>
          ))}
          {provided?.placeholder}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
