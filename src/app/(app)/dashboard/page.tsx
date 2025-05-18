
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
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, status: targetStatus, order: newOrder, updatedAt: new Date().toISOString() };
        }
        return t;
      });

      if (currentTask.status !== targetStatus) {
        updatedTasks
          .filter(t => t.status === currentTask.status && t.id !== taskId)
          .sort((a, b) => a.order - b.order)
          .forEach((t, idx) => t.order = idx);
      }
      
      updatedTasks
        .filter(t => t.status === targetStatus)
        .sort((a, b) => a.order - b.order)
        .forEach((t, idx) => {
             if (t.id === taskId) { t.order = newOrder; } 
             else if (idx >= newOrder && t.id !== taskId) { t.order = idx +1; } 
             else {t.order = idx;}
        });
      
      const sortedUpdatedTasks = KANBAN_COLUMNS.reduce((acc, col) => {
        const columnTasks = updatedTasks.filter(t => t.status === col.id).sort((a,b) => a.order - b.order);
        columnTasks.forEach((t, idx) => t.order = idx); 
        return acc.concat(columnTasks);
      }, [] as Task[]);


      setGlobalTasks(sortedUpdatedTasks); 

      try {
        await moveTask(taskId, targetStatus, newOrder); 
        toast({ title: "Task Moved", description: `Task "${currentTask.title}" moved to ${KANBAN_COLUMNS.find(c=>c.id===targetStatus)?.title}.` });
      } catch (apiError) {
        toast({ variant: "destructive", title: "Move Failed", description: `Could not move task. ${ (apiError as Error).message }` });
      }
    }
  };


  if (!isMounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
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
      {/* This div should be flexible and allow horizontal scrolling for columns */}
      <div className="flex gap-4 md:gap-6 flex-1 overflow-x-auto p-1 pb-4">
        {KANBAN_COLUMNS.map(column => (
          <div 
            key={column.id} 
            className="flex-1 min-w-[320px] h-full" // h-full to take height from parent column
            onDragOver={(e) => e.preventDefault()} 
            onDrop={(e) => handleDrop(e, column.id)} 
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
          <DialogContent className="sm:max-w-[625px] max-h-[85vh] overflow-y-auto">
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
