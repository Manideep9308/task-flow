
"use client";

import { useTasks } from '@/contexts/task-context';
import type { TaskFile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Eye, FileArchive, Paperclip } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function FilesPage() {
  const { tasks, isLoading: tasksLoading } = useTasks();

  const allFiles = tasks.reduce((acc, task) => {
    if (task.files) {
      task.files.forEach(file => {
        acc.push({ ...file, taskTitle: task.title, taskId: task.id });
      });
    }
    return acc;
  }, [] as (TaskFile & { taskTitle: string, taskId: string })[]);

  return (
    <div className="container mx-auto pt-0 pb-2 md:pb-6"> {/* Removed top padding */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 mt-2 md:mt-6"> {/* Added margin-top */}
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileArchive className="h-8 w-8 text-primary" /> Shared Files</h1>
        <Button variant="outline" disabled> 
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
          {tasksLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading files...</p>
          ) : allFiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No files have been shared yet.</p>
          ) : (
            <Table>
              <TableCaption className="mt-4">A list of all files attached to tasks.</TableCaption>
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="View file (mock)">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View File (Mock)</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Download file (mock)">
                              <DownloadCloud className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download File (Mock)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
