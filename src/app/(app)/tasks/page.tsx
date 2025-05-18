"use client";

import { TaskDataTable } from '@/components/tasks/task-data-table';
import { useTasks } from '@/contexts/task-context';
import type { Task } from '@/lib/types';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/task-form';

export default function TasksPage() {
  const { tasks } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  return (
    <div className="container mx-auto py-2 md:py-6">
      <h1 className="text-3xl font-bold mb-6">Task List</h1>
      <TaskDataTable tasks={tasks} onEditTask={handleEditTask} />
      
      {editingTask && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[625px]">
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
