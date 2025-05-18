
"use client";

import type { Task, TaskStatus } from '@/lib/types';
import { BasicTaskCard } from './task-card'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
// DroppableProvided and DraggableProvided types are related to react-beautiful-dnd, 
// which isn't fully integrated. We're using native HTML Drag and Drop for now.

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  // provided?: any; // Placeholder for react-beautiful-dnd if used later
  isDraggingOver?: boolean; // Placeholder for react-beautiful-dnd
}

export function KanbanColumn({ status, title, tasks, onTaskClick, isDraggingOver }: KanbanColumnProps) {
  return (
    <Card 
      className={`flex-1 min-w-[300px] h-full flex flex-col bg-muted/50 ${isDraggingOver ? 'bg-accent/20' : ''}`} // isDraggingOver for visual feedback
      data-status-id={status} 
      // onDragOver and onDrop are on the parent div in DashboardPage
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
          className="p-4 h-full space-y-3" // Added space-y-3 for spacing between cards
          // ref for react-beautiful-dnd if used later
          // {...provided?.droppableProps} for react-beautiful-dnd
          // onDragOver and onDrop are managed by the parent for the whole column
        >
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground py-10">
              No tasks yet
            </div>
          )}
          {tasks.map((task) => ( // index removed as not used for react-beautiful-dnd key here
            <div 
              key={task.id}
              draggable // Make the div draggable
              onDragStart={(e) => { // Set data for the drag operation
                e.dataTransfer.setData('taskId', task.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              // DraggableProps and DragHandleProps for react-beautiful-dnd if used later
            >
              <BasicTaskCard
                task={task}
                onClick={() => onTaskClick(task)}
              />
            </div>
          ))}
          {/* {provided?.placeholder} for react-beautiful-dnd */}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
