
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

// For Predict Timeline Impact Flow / Time Travel / What-If Analyzer
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
  category?: string;
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
  riskAssessment: string;
  keyHighlights: string;
  blockersAndChallenges: string;
  actionableRecommendations: string;
  keyFocusAreas?: string;
  reportDate?: string;
  projectName?: string;
}
export type GenerateProjectHealthReportOutput = ProjectHealthReport;

// For App Assistant
export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

// For App Assistant Tool (Task Querying)
export interface AssistantTaskQueryCriteria {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeName?: string;
  keywords?: string;
  dueDateBefore?: string; // YYYY-MM-DD
  dueDateAfter?: string; // YYYY-MM-DD
}

// For Auto Retrospective Generator
export interface GenerateRetrospectiveReportInput {
  projectName?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  totalTasks: number;
  tasksCompleted: number;
  tasksIncomplete: number;
  tasksDelayed: number;
  tasksBlocked: number;
  topContributors: string[]; // Array of user names or IDs
  activityLogs: string; // Could be a long string or structured differently in a real app
  issueSummary: string; // Summary of key issues
  timelineEvents: string; // Key events in the project timeline
  // We keep tasks for detailed analysis by the AI, even if summarized stats are also passed
  tasks: ProjectTaskSnapshot[];
}

export interface RetrospectiveReportOutput {
  wentWell: string;
  challenges: string; // Corresponds to "What Didn’t Go Well"
  learningsAndImprovements: string; // Corresponds to "Improvement Suggestions"
  performanceMetricsSummary: string; // New field
  overallProjectSentiment?: string; // Kept from previous version, can be useful
  projectName?: string;
  projectEndDate?: string; // This was used as "endDate" conceptually
}

// For Project Premise Validator / Idea Stress Test
export interface ValidateProjectPremiseInput {
  projectIdea: string;
  coreProblemSolved: string;
  targetAudience: string;
  keyGoals: string[]; // Array of strings for goals
}

export interface ValidationSection {
  title: string;
  points: string[];
}

export interface ValidateProjectPremiseOutput {
  potentialBlindSpots: ValidationSection;
  challengingQuestions: ValidationSection;
  potentialRisks: ValidationSection;
  alternativePerspectives: ValidationSection;
}

// Removed MeetingPrepBriefingInput and MeetingPrepBriefingOutput
