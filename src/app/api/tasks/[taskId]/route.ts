
// src/app/api/tasks/[taskId]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Task, Comment } from '@/lib/types'; // Added Comment
import { getTaskById, updateTaskInDB, deleteTaskFromDB } from '@/lib/server-task-store';

interface Params {
  params: { taskId: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { taskId } = params;
    const task = getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error(`Error fetching task ${params.taskId}:`, error);
    return NextResponse.json({ message: 'Error fetching task', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { taskId } = params;
    // Ensure updates can include the comments array
    const updates = (await request.json()) as Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;

    const updatedTask = updateTaskInDB(taskId, updates);

    if (!updatedTask) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error(`Error updating task ${params.taskId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ message: 'Error updating task', error: errorMessage }, { status:500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { taskId } = params;
    const success = deleteTaskFromDB(taskId);

    if (!success) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting task ${params.taskId}:`, error);
    return NextResponse.json({ message: 'Error deleting task', error: (error as Error).message }, { status: 500 });
  }
}
