
"use client";

import type { Task, TaskStatus, Comment } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

interface TaskContextType {
  tasks: Task[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status' | 'comments'> & { status?: TaskStatus; comments?: Comment[] }) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => Promise<void>;
  getTasksByStatus: (status: TaskStatus) => Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  isLoading: boolean;
  error: string | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch tasks: ${response.statusText} (Status: ${response.status})` }));
        throw new Error(errorData.message || `Failed to fetch tasks: ${response.statusText} (Status: ${response.status})`);
      }
      const data: Task[] = await response.json();
      setTasks(data);
    } catch (e) {
      console.error("Error fetching tasks from API:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while fetching tasks.");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status' | 'comments'> & { status?: TaskStatus; comments?: Comment[] }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to add task: ${response.statusText} (Status: ${response.status})` }));
        throw new Error(errorData.message || `Failed to add task: ${response.statusText} (Status: ${response.status})`);
      }
      const newTask: Task = await response.json();
      setTasks(prevTasks => [...prevTasks, newTask].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (e) {
      console.error("Error adding task via API:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while adding task.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setError(null);
    const originalTasks = [...tasks];
    
    // Optimistic update
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      )
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to update task: ${response.statusText} (Status: ${response.status})` }));
        throw new Error(errorData.message || `Failed to update task: ${response.statusText} (Status: ${response.status})`);
      }
      const updatedTaskFromServer: Task = await response.json();
      // Sync with server state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, ...updatedTaskFromServer } : task
        )
      );
    } catch (e) {
      console.error("Error updating task via API:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while updating task.");
      setTasks(originalTasks); // Revert optimistic update on error
    }
  }, [tasks]); // Added tasks to dependency array

  const deleteTask = useCallback(async (taskId: string) => {
    setError(null);
    const originalTasks = [...tasks];
    
    // Optimistic update
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to delete task: ${response.statusText} (Status: ${response.status})` }));
        throw new Error(errorData.message || `Failed to delete task: ${response.statusText} (Status: ${response.status})`);
      }
      // Optimistic update was successful, no need to setTasks again unless response provides data to sync.
    } catch (e) {
      console.error("Error deleting task via API:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while deleting task.");
      setTasks(originalTasks); // Revert optimistic update
    }
  }, [tasks]); // Added tasks to dependency array

  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    // The optimistic update for drag & drop is complex and best handled by a dedicated library or more
    // sophisticated state management if full rollback capabilities are needed for the visual reordering
    // of multiple tasks in multiple columns.
    // For now, we'll update the moved task's status and order locally and then persist that one change.
    
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    const updatedMovedTask = { 
      ...taskToMove, 
      status: newStatus, 
      order: newOrder, 
      updatedAt: new Date().toISOString(),
      // Ensure comments are preserved during move if they exist on taskToMove
      comments: taskToMove.comments || [] 
    };

    // Optimistically update the UI
    // This simple setTasks might not perfectly reorder all other tasks in columns visually
    // A more robust approach would involve recalculating orders for all affected tasks
    setTasks(prevTasks => 
      prevTasks.map(t => t.id === taskId ? updatedMovedTask : t)
               .sort((a, b) => a.order - b.order) // Basic sort for visual consistency
    );
    
    try {
      // Persist only the changes for the moved task (status, order, and comments if updated)
      // The backend would ideally handle reordering other tasks if necessary.
      await updateTask(taskId, { 
        status: newStatus, 
        order: newOrder, 
        comments: updatedMovedTask.comments 
      });
    } catch (e) {
      console.error("Error syncing moved task with API, UI might be inconsistent until next fetch:", e);
      setError(e instanceof Error ? e.message : "Error syncing task move.");
      // Consider fetching all tasks again to ensure consistency if a move fails to persist
      // fetchTasks(); // Or provide a more targeted rollback
    }
  }, [tasks, updateTask]);


  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status).sort((a, b) => a.order - b.order);
  }, [tasks]);

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, moveTask, getTasksByStatus, setTasks, isLoading, error }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
