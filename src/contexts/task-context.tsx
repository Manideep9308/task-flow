
"use client";

import type { Task, TaskStatus } from '@/lib/types';
// mockTasks import removed, will fetch from API
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
// v4 as uuidv4 import removed, ID will come from backend

interface TaskContextType {
  tasks: Task[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status'> & { status?: TaskStatus }) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => Promise<void>; // Should also be async if calling API
  getTasksByStatus: (status: TaskStatus) => Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>; // For local optimistic updates e.g. drag and drop
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
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }
      const data: Task[] = await response.json();
      setTasks(data);
    } catch (e) {
      console.error("Error fetching tasks from API:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while fetching tasks.");
      setTasks([]); // Set to empty or keep stale data, depending on desired UX
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status'> & { status?: TaskStatus }) => {
    setError(null);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to add task: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to add task: ${response.statusText}`);
      }
      const newTask: Task = await response.json();
      setTasks(prevTasks => [...prevTasks, newTask]);
    } catch (e) {
      console.error("Error adding task via API:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while adding task.");
      // Optionally re-throw or handle UI feedback
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to update task: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to update task: ${response.statusText}`);
      }
      const updatedTask: Task = await response.json();
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, ...updatedTask } : task // Use data from API response
        )
      );
    } catch (e) {
      console.error("Error updating task via API:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while updating task.");
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: `Failed to delete task: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to delete task: ${response.statusText}`);
      }
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (e) {
      console.error("Error deleting task via API:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred while deleting task.");
    }
  }, []);

  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    // Optimistic UI update
    const originalTasks = tasks;
    let movedTask: Task | undefined;

    setTasks(prevTasks => {
      const taskToMove = prevTasks.find(t => t.id === taskId);
      if (!taskToMove) return prevTasks;

      movedTask = { ...taskToMove, status: newStatus, order: newOrder, updatedAt: new Date().toISOString() };
      
      let tasksWithoutMoved = prevTasks.filter(t => t.id !== taskId);
      
      if (taskToMove.status !== newStatus) {
         tasksWithoutMoved = tasksWithoutMoved.map(t => {
            if (t.status === taskToMove.status && t.order > taskToMove.order) {
                return {...t, order: t.order -1 };
            }
            return t;
         });
      }
      
      tasksWithoutMoved = tasksWithoutMoved.map(t => {
        if (t.status === newStatus && t.order >= newOrder) {
            return {...t, order: t.order + 1};
        }
        return t;
      });
      
      const finalTasks = [...tasksWithoutMoved, movedTask];

      const statusGroups = finalTasks.reduce((acc, task) => {
        acc[task.status] = acc[task.status] || [];
        acc[task.status].push(task);
        return acc;
      }, {} as Record<TaskStatus, Task[]>);

      for (const statusKey in statusGroups) {
        statusGroups[statusKey as TaskStatus].sort((a,b) => a.order - b.order);
      }
      
      return Object.values(statusGroups).flat();
    });

    // API call to update the task on the server
    if (movedTask) {
      try {
        const { id, createdAt, ...updatePayload } = movedTask; // Exclude id and createdAt from payload
        await updateTask(taskId, updatePayload as Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>);
      } catch (e) {
        console.error("Error syncing moved task with API, reverting UI:", e);
        setError(e instanceof Error ? e.message : "Error syncing task move.");
        setTasks(originalTasks); // Revert optimistic update on error
      }
    }
  }, [tasks, updateTask]); // Added updateTask dependency


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
