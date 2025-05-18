
"use client";

import type { Task, TaskStatus, TaskPriority, TaskFile } from '@/lib/types';
import { mockTasks } from '@/lib/mock-data';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface TaskContextType {
  tasks: Task[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status'> & { status?: TaskStatus }) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
  getTasksByStatus: (status: TaskStatus) => Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>; // For drag and drop reordering
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const localData = localStorage.getItem('tasks');
      try {
        // Ensure data is valid JSON and an array before parsing
        if (localData) {
            const parsedData = JSON.parse(localData);
            if (Array.isArray(parsedData)) {
                return parsedData;
            }
        }
      } catch (error) {
        console.error("Error parsing tasks from localStorage:", error);
        // Fallback to mockTasks if localStorage data is corrupted
      }
      return mockTasks;
    }
    return mockTasks;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status'> & { status?: TaskStatus }) => {
    const newTaskStatus = taskData.status || 'todo';
    const newTask: Task = {
      ...taskData,
      id: uuidv4(), // Use direct uuidv4 import
      status: newTaskStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.filter(t => t.status === newTaskStatus).length,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  }, [tasks]);

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      )
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus, newOrder: number) => {
    setTasks(prevTasks => {
      const taskToMove = prevTasks.find(t => t.id === taskId);
      if (!taskToMove) return prevTasks;

      // Remove task from its old position
      let tasksWithoutMoved = prevTasks.filter(t => t.id !== taskId);
      
      // Update status and order for the moved task
      const movedTask = { ...taskToMove, status: newStatus, order: newOrder, updatedAt: new Date().toISOString() };

      // Re-calculate order for tasks in the old column if status changed
      if (taskToMove.status !== newStatus) {
         tasksWithoutMoved = tasksWithoutMoved.map(t => {
            if (t.status === taskToMove.status && t.order > taskToMove.order) {
                return {...t, order: t.order -1 };
            }
            return t;
         });
      }
      
      // Adjust orders in the new column: increment order of tasks at or after newOrder
      tasksWithoutMoved = tasksWithoutMoved.map(t => {
        if (t.status === newStatus && t.order >= newOrder) {
            return {...t, order: t.order + 1};
        }
        return t;
      });
      
      // Add the moved task
      const finalTasks = [...tasksWithoutMoved, movedTask];

      // Sort tasks within each status group by order for consistency
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
  }, []);


  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status).sort((a, b) => a.order - b.order);
  }, [tasks]);

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, moveTask, getTasksByStatus, setTasks }}>
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
