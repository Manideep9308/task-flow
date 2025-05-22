
import type { Task, StandupSummary } from './types';

// Using IDs from MOCK_USERS_LIST in auth-context.tsx
const mockUserAliceId = 'user-alice-01';
const mockUserBobId = 'user-bob-02';
const mockUserCharlieId = 'user-charlie-03';


export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Design homepage UI',
    description: 'Create mockups for the new homepage design, focusing on user experience and modern aesthetics.',
    status: 'todo',
    priority: 'high',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    category: 'Work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [
      { id: 'file-1', name: 'style_guide.pdf', url: '#', size: 1024 * 500, type: 'application/pdf' },
    ],
    order: 0,
    assignedTo: mockUserAliceId,
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'task-2',
    title: 'Develop API endpoints',
    description: 'Implement RESTful API endpoints for task management, including CRUD operations.',
    status: 'inprogress',
    priority: 'high',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
    category: 'Work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 0,
    assignedTo: mockUserBobId,
  },
  {
    id: 'task-3',
    title: 'Write project proposal',
    description: 'Draft the project proposal document, outlining scope, deliverables, and timeline.',
    status: 'done',
    priority: 'medium',
    category: 'Work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 0,
    // No assignee
  },
  {
    id: 'task-4',
    title: 'Grocery Shopping',
    description: 'Buy milk, eggs, bread, and cheese.',
    status: 'todo',
    priority: 'medium',
    category: 'Personal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 1,
    assignedTo: mockUserCharlieId,
  },
  {
    id: 'task-5',
    title: 'Book flight tickets',
    description: 'Book flights for the upcoming conference.',
    status: 'inprogress',
    priority: 'low',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    category: 'Personal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 1,
  },
  {
    id: 'task-6',
    title: 'Study for exam',
    description: 'Review notes for Chapter 5 and 6.',
    status: 'todo',
    priority: 'high',
    category: 'Study',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: 2,
    assignedTo: mockUserAliceId,
  },
];

export const mockStandupSummaries: StandupSummary[] = [
  {
    id: 'sum-2024-07-28',
    date: '2024-07-28',
    summaryText: `**Project Alpha Standup - July 28, 2024**

**Yesterday:**
*   Alice: Finished homepage mockups (Task-1) and started research for exam (Task-6).
*   Bob: Continued development on API user authentication (related to Task-2).
*   Charlie: Went grocery shopping (Task-4).

**Today:**
*   Alice: Will finalize homepage design details and continue exam study.
*   Bob: Aims to complete the core API logic for task creation.
*   Charlie: Will start planning for the personal budget review.

**Blockers:**
*   Bob: Minor issue with database schema migration script, needs review.
`,
  },
  {
    id: 'sum-2024-07-27',
    date: '2024-07-27',
    summaryText: `**Project Alpha Standup - July 27, 2024**

**Yesterday:**
*   Alice: Worked on initial wireframes for homepage (Task-1).
*   Bob: Set up the development environment for API (Task-2).
*   Charlie: Planned grocery list.

**Today:**
*   Alice: Will iterate on homepage mockups based on feedback.
*   Bob: To begin implementing API endpoints for tasks.
*   Charlie: Grocery shopping (Task-4).

**Blockers:**
*   None reported.
`,
  },
];

