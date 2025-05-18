"use client";

import type { Task, TaskPriority, TaskStatus, TaskFile } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Paperclip, PlusCircle, Trash2, UploadCloud } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { TASK_PRIORITIES, TASK_STATUSES, DEFAULT_CATEGORIES } from '@/lib/constants';
import { useTasks } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

const taskFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().optional(),
  status: z.custom<TaskStatus>((val) => TASK_STATUSES.map(s => s.value).includes(val as TaskStatus), {
    message: "Invalid status",
  }),
  priority: z.custom<TaskPriority>((val) => TASK_PRIORITIES.map(p => p.value).includes(val as TaskPriority), {
    message: "Invalid priority",
  }),
  dueDate: z.date().optional(),
  category: z.string().optional(),
  files: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    size: z.number(),
    type: z.string(),
  })).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: Task | null; // For editing
  onOpenChange?: (open: boolean) => void; // To close dialog on submit
}

export function TaskForm({ task, onOpenChange }: TaskFormProps) {
  const { addTask, updateTask } = useTasks();
  const { toast } = useToast();
  const [currentFiles, setCurrentFiles] = useState<TaskFile[]>(task?.files || []);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      dueDate: task?.dueDate ? parseISO(task.dueDate) : undefined,
      category: task?.category || '',
      files: task?.files || [],
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? parseISO(task.dueDate) : undefined,
        category: task.category || '',
        files: task.files || [],
      });
      setCurrentFiles(task.files || []);
    } else {
      form.reset({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: undefined,
        category: '',
        files: [],
      });
      setCurrentFiles([]);
    }
  }, [task, form]);

  const onSubmit = (data: TaskFormValues) => {
    const taskData = {
      ...data,
      dueDate: data.dueDate ? format(data.dueDate, 'yyyy-MM-dd') : undefined,
      files: currentFiles,
    };

    if (task && task.id) {
      updateTask(task.id, taskData);
      toast({ title: "Task Updated", description: `"${data.title}" has been updated.` });
    } else {
      addTask(taskData);
      toast({ title: "Task Created", description: `"${data.title}" has been added.` });
    }
    onOpenChange?.(false); // Close dialog
    form.reset();
    setCurrentFiles([]);
  };

  const handleFileAdd = () => {
    // This is a mock file add. In a real app, this would open a file picker.
    const newFile: TaskFile = {
      id: `file-${Date.now()}`,
      name: `document-${currentFiles.length + 1}.pdf`,
      url: '#',
      size: Math.floor(Math.random() * (2048 * 1024 - 100 * 1024 + 1)) + (100 * 1024), // Random size between 100KB and 2MB
      type: 'application/pdf',
    };
    setCurrentFiles(prev => [...prev, newFile]);
  };

  const handleFileRemove = (fileId: string) => {
    setCurrentFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register('title')} placeholder="e.g., Schedule team meeting" />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register('description')} placeholder="Add more details about the task..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Controller
            name="priority"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Controller
            name="dueDate"
            control={form.control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Controller
            name="category"
            control={form.control}
            render={({ field }) => (
               <Input id="category" {...field} list="category-suggestions" placeholder="e.g., Work, Personal" />
            )}
          />
          <datalist id="category-suggestions">
            {DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
          </datalist>
        </div>
      </div>

      <div>
        <Label>Files</Label>
        <div className="space-y-2 mt-1">
          {currentFiles.map(file => (
            <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-secondary/50">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleFileRemove(file.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleFileAdd} className="w-full">
            <UploadCloud className="mr-2 h-4 w-4" /> Add Mock File
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
        </Button>
      </div>
    </form>
  );
}
