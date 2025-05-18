
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
  assignedTo?: string; // User ID of the assignee
}

export type UserRole = 'admin' | 'member';

// Basic User type for mock authentication
export interface User {
  id: string; 
  email: string;
  name?: string;
  role?: UserRole; // Add role property
  // Add other relevant user fields here, e.g., avatarUrl
}
