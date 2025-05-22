
export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskFile {
  id: string;
  name: string;
  url: string; // For simplicity, a placeholder URL
  size: number; // in bytes
  type: string; // MIME type
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string; // ISO string
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
  comments?: Comment[];
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
  blockers?: string; // Made optional
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
  suggestedSolutions?: string[];
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

// For Team Chat
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string; // ISO string
}

// For AI Chat Replies
export interface SuggestChatRepliesInput {
  recentMessages: ChatMessage[];
  currentUser: User; // To help AI tailor suggestions if needed
}
export interface SuggestChatRepliesOutput {
  suggestedReplies: string[];
}

// For AI Chat Highlights
export interface GenerateChatHighlightsInput {
  messages: ChatMessage[];
}
export interface GenerateChatHighlightsOutput {
  highlights: string;
}

// For AI Project Health Report
export interface ProjectTaskSnapshot {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  category?: string;
}

export interface GenerateProjectHealthReportInput {
  tasks: ProjectTaskSnapshot[];
  projectName?: string;
  reportDate?: string; // YYYY-MM-DD
}

export interface ProjectHealthReport {
  overallSummary: string;
  riskAssessment: string; // Could detail overdue tasks, high-priority pile-ups
  keyHighlights: string; // Positive developments, completed milestones
  blockersAndChallenges: string;
  actionableRecommendations: string;
  reportDate?: string;
  projectName?: string;
}
export type GenerateProjectHealthReportOutput = ProjectHealthReport;
