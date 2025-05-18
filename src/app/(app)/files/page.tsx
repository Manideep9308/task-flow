"use client";

import { useTasks } from '@/contexts/task-context';
import type { TaskFile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Eye, LinkIcon, Paperclip } from 'lucide-react';
import Link from 'next/link';

export default function FilesPage() {
  const { tasks } = useTasks();

  const allFiles = tasks.reduce((acc, task) => {
    if (task.files) {
      task.files.forEach(file => {
        acc.push({ ...file, taskTitle: task.title, taskId: task.id });
      });
    }
    return acc;
  }, [] as (TaskFile & { taskTitle: string, taskId: string })[]);

  return (
    <div className="container mx-auto py-2 md:py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shared Files</h1>
        <Button variant="outline" disabled> {/* Mock upload button */}
          <Paperclip className="mr-2 h-4 w-4" />
          Upload File (Mock)
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Files</CardTitle>
          <CardDescription>
            Browse all files attached to your tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allFiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No files have been shared yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Associated Task</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFiles.map(file => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                       <Paperclip className="h-4 w-4 text-muted-foreground" /> {file.name}
                    </TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell>{(file.size / 1024).toFixed(1)} KB</TableCell>
                    <TableCell>
                      <Link href={`/tasks?taskId=${file.taskId}`} className="text-primary hover:underline">
                        {file.taskTitle}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="View (Mock)">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download (Mock)">
                        <DownloadCloud className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
