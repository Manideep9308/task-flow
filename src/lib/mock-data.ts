
import type { Task } from './types';

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
