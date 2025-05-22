
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
    // Removed: imageUrl: taskData.imageUrl,
  };

  tasksDB.push(newTask);
  return newTask;
}

export function updateTaskInDB(taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Task | null {
  const taskIndex = tasksDB.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return null;
  }

  const updatedTaskData = { ...tasksDB[taskIndex], ...updates, updatedAt: new Date().toISOString() };
  
  // Explicitly remove imageUrl from the updates if it was part of the Task type before
  const { imageUrl, ...restOfUpdates } = updates as any; // Cast to any to handle potential old imageUrl

  tasksDB[taskIndex] = { 
    ...tasksDB[taskIndex], 
    ...restOfUpdates, 
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
