
"use client";

import { KanbanColumn } from '@/components/tasks/kanban-column';
import { useTasks } from '@/contexts/task-context';
// import { useAuth } from '@/contexts/auth-context'; // Not needed here if TaskCard pulls from context
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

export default function DashboardPage() {
  const { tasks, getTasksByStatus, setTasks: setGlobalTasks } = useTasks();
  // const { assignableUsers } = useAuth(); // Not strictly needed if KanbanColumn/TaskCard get it from context
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
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
        .forEach((t, idx) => t.order = idx);

      setGlobalTasks(updatedTasks); 
      toast({ title: "Task Moved", description: `Task "${currentTask.title}" moved to ${targetStatus}.` });
    }
  };


  if (!isMounted) {
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
            data-status-id={column.id} 
          >
            <KanbanColumn
              status={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.id)}
              onTaskClick={handleTaskClick}
              // assignableUsers prop removed
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
