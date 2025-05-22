
// src/app/api/tasks/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Task, TaskStatus, Comment } from '@/lib/types';
import { getAllTasks, createTask as createTaskInDB } from '@/lib/server-task-store';

export async function GET(request: NextRequest) {
  try {
    const tasks = getAllTasks();
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ message: 'Error fetching tasks', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure taskData can include comments
    const taskData = (await request.json()) as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'status' | 'comments'> & { status?: TaskStatus; comments?: Comment[] };

    if (!taskData.title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }
    
    const newTask = createTaskInDB(taskData);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ message: 'Error creating task', error: errorMessage }, { status: 500 });
  }
}
