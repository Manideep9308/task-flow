"use client";

import type { Task, TaskStatus, TaskPriority, TaskFile } from '@/lib/types';
import { mockTasks } from '@/lib/mock-data';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Added for generating unique IDs

// Dynamically import uuid for client-side usage to avoid SSR issues
let generateId = () => '';
if (typeof window !== 'undefined') {
  import('uuid').then(uuidModule => {
    generateId = uuidModule.v4;
  });
}


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
      return localData ? JSON.parse(localData) : mockTasks;
    }
    return mockTasks;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status'> & { status?: TaskStatus }) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      status: taskData.status || 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.filter(t => t.status === (taskData.status || 'todo')).length,
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
      const tasksWithoutMoved = prevTasks.filter(t => t.id !== taskId);
      
      // Update status and order
      const movedTask = { ...taskToMove, status: newStatus, order: newOrder, updatedAt: new Date().toISOString() };

      // Re-calculate order for tasks in the old column if status changed
      if (taskToMove.status !== newStatus) {
         tasksWithoutMoved.filter(t => t.status === taskToMove.status).sort((a,b) => a.order - b.order).forEach((t, idx) => t.order = idx);
      }
      
      // Insert task into new position and update orders in the new column
      const targetColumnTasks = tasksWithoutMoved.filter(t => t.status === newStatus);
      targetColumnTasks.splice(newOrder, 0, movedTask);
      targetColumnTasks.forEach((t, idx) => t.order = idx);

      const otherTasks = tasksWithoutMoved.filter(t => t.status !== newStatus && t.status !== taskToMove.status);
      
      return [...otherTasks, ...targetColumnTasks, ...tasksWithoutMoved.filter(t => t.status === taskToMove.status && t.id !== taskId)].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
