
export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskFile {
  id: string;
  name: string;
  url: string; // For simplicity, a placeholder URL
  size: number; // in bytes
  type: string; // MIME type
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO string YYYY-MM-DD
  category?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  files?: TaskFile[];
  order: number; // For maintaining order within Kanban columns
}

// Basic User type for mock authentication
export interface User {
  id?: string; // Optional, can be added if using a DB
  email: string;
  name?: string;
  // Add other relevant user fields here, e.g., avatarUrl
}
