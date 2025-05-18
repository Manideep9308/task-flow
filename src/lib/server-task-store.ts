
// In-memory store for tasks on the server
import type { Task, TaskStatus } from '@/lib/types';
import { mockTasks as initialMockTasks } from '@/lib/mock-data'; // Renamed to avoid conflict
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

export function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status'> & { status?: TaskStatus }): Task {
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
    imageUrl: taskData.imageUrl, // Ensure imageUrl is included
  };

  tasksDB.push(newTask);
  return newTask;
}

export function updateTaskInDB(taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Task | null {
  const taskIndex = tasksDB.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return null;
  }

  // Ensure `imageUrl` can be explicitly set to undefined or null if that's intended by `updates`
  const updatedTask = { 
    ...tasksDB[taskIndex], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  };
  
  // If imageUrl is part of updates and is explicitly set to undefined, ensure it's handled
  if (updates.hasOwnProperty('imageUrl') && updates.imageUrl === undefined) {
    updatedTask.imageUrl = undefined;
  }


  tasksDB[taskIndex] = updatedTask;
  return updatedTask;
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
