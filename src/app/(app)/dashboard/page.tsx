
"use client";

import { KanbanColumn } from '@/components/tasks/kanban-column';
import { useTasks } from '@/contexts/task-context';
import { KANBAN_COLUMNS } from '@/lib/constants';
import type { Task, TaskStatus } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/task-form';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function DashboardPage() {
  const { tasks, getTasksByStatus, moveTask, isLoading, error: taskError, setTasks: setGlobalTasks } = useTasks();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true); 
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const targetColumnElement = (e.target as HTMLElement).closest('[data-status-id]');
    if (!targetColumnElement) return;
    
    const tasksInTargetColumn = getTasksByStatus(targetStatus);
    let newOrder = tasksInTargetColumn.length;

    const dropTargetCard = (e.target as HTMLElement).closest('[role="button"]'); 
    if (dropTargetCard) {
        const siblingCards = Array.from(targetColumnElement.querySelectorAll('[role="button"]'));
        const dropIndex = siblingCards.indexOf(dropTargetCard);
        if (dropIndex !== -1) {
            newOrder = dropIndex;
        }
    }
    
    const currentTask = tasks.find(t => t.id === taskId);
    if (currentTask) {
      // Optimistic update handled by moveTask internally now if drag and drop is used for it
      // For now, we use setGlobalTasks for local drag-drop, and moveTask will be called by it.
      // This part is slightly complex due to optimistic updates + API.
      // Let's call `moveTask` which handles both optimistic and API update.

      // Original drag-and-drop logic based on setGlobalTasks for immediate local reordering
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, status: targetStatus, order: newOrder, updatedAt: new Date().toISOString() };
        }
        return t;
      });

      // Re-order tasks in the source column
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
        .forEach((t, idx) => {
             if (t.id === taskId) { t.order = newOrder; } // ensure moved task has correct newOrder
             else if (idx >= newOrder && t.id !== taskId) { t.order = idx +1; } // shift others
             else {t.order = idx;}
        });
      
      // Sort all tasks again to ensure order consistency before setting global state
      const sortedUpdatedTasks = KANBAN_COLUMNS.reduce((acc, col) => {
        const columnTasks = updatedTasks.filter(t => t.status === col.id).sort((a,b) => a.order - b.order);
        columnTasks.forEach((t, idx) => t.order = idx); // Final re-indexing per column
        return acc.concat(columnTasks);
      }, [] as Task[]);


      setGlobalTasks(sortedUpdatedTasks); // Optimistic UI update

      try {
        await moveTask(taskId, targetStatus, newOrder); // API call
        toast({ title: "Task Moved", description: `Task "${currentTask.title}" moved to ${KANBAN_COLUMNS.find(c=>c.id===targetStatus)?.title}.` });
      } catch (apiError) {
        toast({ variant: "destructive", title: "Move Failed", description: `Could not move task. ${ (apiError as Error).message }` });
        // Revert to original tasks if API call fails - TaskProvider might handle this, or do it here.
        // For simplicity, we assume TaskProvider handles errors/reversions if needed.
        // Or fetch fresh tasks:
        // fetchTasks(); 
      }
    }
  };


  if (!isMounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  if (taskError) {
     return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Tasks</AlertTitle>
          <AlertDescription>{taskError}</AlertDescription>
        </Alert>
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
            onDragOver={(e) => e.preventDefault()} // Standard HTML D&D API
            onDrop={(e) => handleDrop(e, column.id)} // Standard HTML D&D API
            data-status-id={column.id} 
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
