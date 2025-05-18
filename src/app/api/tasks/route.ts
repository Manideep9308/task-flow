
// src/app/api/tasks/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Task, TaskStatus } from '@/lib/types'; // Assuming types are sharable
import { mockTasks as serverMockTasks } from '@/lib/mock-data'; // Using a renamed import for clarity
import { v4 as uuidv4 } from 'uuid';

// In-memory store for tasks on the server
let tasks: Task[] = [...serverMockTasks]; // Initialize with a copy of mockTasks

export async function GET(request: NextRequest) {
  try {
    // In a real app, you might have query params for filtering, pagination, etc.
    // const { searchParams } = new URL(request.url);
    // const status = searchParams.get('status');
    // let filteredTasks = tasks;
    // if (status) {
    //   filteredTasks = tasks.filter(task => task.status === status);
    // }
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ message: 'Error fetching tasks', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = (await request.json()) as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'> & { status?: TaskStatus };

    if (!taskData.title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
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
      order: tasks.filter(t => t.status === newTaskStatus).length, // Simple ordering
      assignedTo: taskData.assignedTo,
    };

    tasks.push(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ message: 'Error creating task', error: (error as Error).message }, { status: 500 });
  }
}
