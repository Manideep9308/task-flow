
// In-memory store for tasks on the server
import type { Task, TaskStatus, Comment } from '@/lib/types';
import { mockTasks as initialMockTasks } from '@/lib/mock-data';
import { v4 as uuidv4 } from 'uuid';

// Initialize with a copy of mockTasks from mock-data.ts
// This array will be mutated by the API routes.
export let tasksDB: Task[] = initialMockTasks.map(task => ({...task}));

export function getAllTasks(): Task[] {
  return tasksDB;
}

export function getTaskById(taskId: string): Task | undefined {
  return tasksDB.find(t => t.id === taskId);
}

export function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status' | 'comments'> & { status?: TaskStatus; comments?: Comment[] }): Task {
  if (!taskData.title) {
    throw new Error('Title is required');
  }

  const newTaskStatus = taskData.status || 'todo';
  const newTask: Task = {
    id: uuidv4(),
    title: taskData.title,
    description: taskData.description || '',
    status: newTaskStatus,
    priority: taskData.priority || 'medium',
    dueDate: taskData.dueDate,
    category: taskData.category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: taskData.files || [],
    order: tasksDB.filter(t => t.status === newTaskStatus).length,
    assignedTo: taskData.assignedTo,
    comments: taskData.comments || [], // Initialize comments
  };

  tasksDB.push(newTask);
  // Sort the entire DB to mimic some persistent order, in a real DB this would be handled by queries
  tasksDB.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return newTask;
}

export function updateTaskInDB(taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Task | null {
  const taskIndex = tasksDB.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return null;
  }
  
  // Ensure comments array is part of the updates if provided, otherwise keep existing
  const existingTask = tasksDB[taskIndex];
  const updatedComments = 'comments' in updates ? updates.comments : existingTask.comments;

  tasksDB[taskIndex] = { 
    ...existingTask, 
    ...updates,
    comments: updatedComments, // Explicitly handle comments
    updatedAt: new Date().toISOString() 
  };
  
  return tasksDB[taskIndex];
}

export function deleteTaskFromDB(taskId: string): boolean {
  const taskIndex = tasksDB.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return false;
  }
  tasksDB.splice(taskIndex, 1);
  // Re-order remaining tasks in the same status column if needed (simplified: not done here for basic delete)
  return true;
}
