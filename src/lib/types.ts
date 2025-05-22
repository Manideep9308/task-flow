
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

// For Smart Standup Bot
export interface StandupReportItem {
  userId: string;
  userName: string;
  didYesterday: string;
  doingToday: string;
  blockers: string;
}

export interface StandupSummary {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  summaryText: string;
  projectId?: string; // Optional: if summaries are per-project
}

// For Predict Timeline Impact Flow
export interface AffectedTask {
  taskId: string;
  title: string;
  impact: string;
}

export interface PredictTimelineImpactOutput {
  impactSummary: string;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  predictedCompletionDate?: string;
  affectedTasks?: AffectedTask[];
  warningsAndConsiderations?: string[];
}

export interface TaskSnapshot {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  description?: string;
}

export interface PredictTimelineImpactInput {
  currentTasks: TaskSnapshot[];
  scenarioDescription: string;
}
