"use client";

import { KanbanColumn } from '@/components/tasks/kanban-column';
import { useTasks } from '@/contexts/task-context';
import { KANBAN_COLUMNS } from '@/lib/constants';
import type { Task, TaskStatus } from '@/lib/types';
import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/task-form';
import { useToast } from '@/hooks/use-toast';

// Conditional import for react-beautiful-dnd if it were installed
// For now, we will use native HTML Drag and Drop
// import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export default function DashboardPage() {
  const { tasks, getTasksByStatus, moveTask, setTasks: setGlobalTasks } = useTasks();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true); // Ensure component is mounted before trying to use drag and drop or localStorage dependent state
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  // Native HTML Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const targetColumnElement = (e.target as HTMLElement).closest('[data-status-id]');
    if (!targetColumnElement) return;

    const tasksInTargetColumn = getTasksByStatus(targetStatus);
    
    // Basic reordering: for simplicity, just append. 
    // A more robust solution would calculate exact position based on drop coordinates.
    let newOrder = tasksInTargetColumn.length;

    // Find the element being dropped onto to calculate position (simplified)
    const dropTargetCard = (e.target as HTMLElement).closest('[role="button"]'); // Assuming TaskCard has role="button"
    if (dropTargetCard) {
        const siblingCards = Array.from(targetColumnElement.querySelectorAll('[role="button"]'));
        const dropIndex = siblingCards.indexOf(dropTargetCard);
        if (dropIndex !== -1) {
            newOrder = dropIndex;
        }
    }
    
    // Update task state
    const currentTask = tasks.find(t => t.id === taskId);
    if (currentTask) {
      // Create a new list of tasks reflecting the change
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, status: targetStatus, order: newOrder, updatedAt: new Date().toISOString() };
        }
        return t;
      });

      // Re-order tasks in the source column if status changed
      if (currentTask.status !== targetStatus) {
        updatedTasks
          .filter(t => t.status === currentTask.status && t.id !== taskId)
          .sort((a, b) => a.order - b.order)
          .forEach((t, idx) => t.order = idx);
      }
      
      // Re-order tasks in the target column
      updatedTasks
        .filter(t => t.status === targetStatus)
        .sort((a, b) => a.order - b.order)
        .forEach((t, idx) => t.order = idx);

      setGlobalTasks(updatedTasks); // Update context/global state
      toast({ title: "Task Moved", description: `Task "${currentTask.title}" moved to ${targetStatus}.` });
    }
  };


  if (!isMounted) {
    // Optional: return a loading skeleton or null
    return (
      <div className="flex gap-6 h-[calc(100vh-10rem)] overflow-x-auto p-1">
        {KANBAN_COLUMNS.map(column => (
          <div key={column.id} className="flex-1 min-w-[300px] bg-muted/30 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 p-2 border-b">{column.title}</h2>
            <div className="animate-pulse space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-md"></div>)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 md:gap-6 h-[calc(100vh-8rem)] overflow-x-auto p-1 pb-4">
        {KANBAN_COLUMNS.map(column => (
          <div 
            key={column.id} 
            className="flex-1 min-w-[320px] h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            data-status-id={column.id} // For drop target identification
          >
            <KanbanColumn
              status={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.id)}
              onTaskClick={handleTaskClick}
            />
          </div>
        ))}
      </div>

      {selectedTask && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update the details for your task.
              </DialogDescription>
            </DialogHeader>
            <TaskForm task={selectedTask} onOpenChange={setIsEditModalOpen} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
