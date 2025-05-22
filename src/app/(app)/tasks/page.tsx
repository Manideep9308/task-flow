
"use client";

import { TaskDataTable } from '@/components/tasks/task-data-table';
import { useTasks } from '@/contexts/task-context';
import type { Task } from '@/lib/types';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/task-form';

function TasksPageContent() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const searchParams = useSearchParams();

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    if (tasksLoading) return; 

    const taskIdToOpen = searchParams.get('openTask');
    if (taskIdToOpen) {
      const taskToEdit = tasks.find(task => task.id === taskIdToOpen);
      if (taskToEdit) {
        handleEditTask(taskToEdit);
      }
    }
  }, [searchParams, tasks, tasksLoading]);

  return (
    <div className="px-4 sm:px-6"> {/* Changed from container mx-auto */}
      <h1 className="text-3xl font-bold mb-6 mt-2 md:mt-6">Task List</h1>
      <TaskDataTable tasks={tasks} onEditTask={handleEditTask} />
      
      {editingTask && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[625px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update the details for your task.
              </DialogDescription>
            </DialogHeader>
            <TaskForm task={editingTask} onOpenChange={setIsEditModalOpen} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Wrap TasksPageContent with Suspense for useSearchParams
export default function TasksPage() {
  return (
    <Suspense fallback={<div className="px-4 sm:px-6 pt-6">Loading task details...</div>}>
      <TasksPageContent />
    </Suspense>
  );
}
