
"use client";

import type { Task, TaskPriority, TaskStatus, TaskFile, Comment } from '@/lib/types';
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
import { CalendarIcon, Paperclip, Trash2, UploadCloud, UserCircle, Wand2, Loader2, Brain, Sparkles, MessageSquare, Send } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn, getInitials } from '@/lib/utils';
import { TASK_PRIORITIES, TASK_STATUSES, DEFAULT_CATEGORIES } from '@/lib/constants';
import { useTasks } from '@/contexts/task-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { suggestTaskDetails } from '@/ai/flows/suggest-task-details-flow';
import { suggestSubtasks } from '@/ai/flows/suggest-subtasks-flow';
import { suggestTaskPriority } from '@/ai/flows/suggest-task-priority-flow';

import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle as UiCardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { v4 as uuidv4 } from 'uuid';


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
  assignedTo: z.string().optional(),
  files: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    size: z.number(),
    type: z.string(),
  })).optional(),
  comments: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    text: z.string(),
    timestamp: z.string(),
  })).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: Task | null;
  onOpenChange?: (open: boolean) => void;
}

const UNASSIGNED_FORM_VALUE = "";
const UNASSIGNED_SELECT_ITEM_VALUE = "__UNASSIGNED__";

export function TaskForm({ task, onOpenChange }: TaskFormProps) {
  const { addTask, updateTask } = useTasks();
  const { user, assignableUsers } = useAuth();
  const { toast } = useToast();
  const [currentFiles, setCurrentFiles] = useState<TaskFile[]>(task?.files || []);
  const [currentComments, setCurrentComments] = useState<Comment[]>(task?.comments || []);
  const [newCommentText, setNewCommentText] = useState("");

  const [isSuggestingDetails, setIsSuggestingDetails] = useState(false);
  const [isSuggestingPriority, setIsSuggestingPriority] = useState(false);

  const [suggestedSubtasksList, setSuggestedSubtasksList] = useState<string[]>([]);
  const [isSuggestingSubtasks, setIsSuggestingSubtasks] = useState(false);
  const [subtasksError, setSubtasksError] = useState<string | null>(null);


  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      dueDate: task?.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : undefined,
      category: task?.category || '',
      assignedTo: task?.assignedTo || UNASSIGNED_FORM_VALUE,
      files: task?.files || [],
      comments: task?.comments || [],
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : undefined,
        category: task.category || '',
        assignedTo: task.assignedTo || UNASSIGNED_FORM_VALUE,
        files: task.files || [],
        comments: task.comments || [],
      });
      setCurrentFiles(task.files || []);
      setCurrentComments(task.comments || []);
      setSuggestedSubtasksList([]);
      setSubtasksError(null);
    } else {
      form.reset({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: undefined,
        category: '',
        assignedTo: UNASSIGNED_FORM_VALUE,
        files: [],
        comments: [],
      });
      setCurrentFiles([]);
      setCurrentComments([]);
      setSuggestedSubtasksList([]);
      setSubtasksError(null);
    }
  }, [task, form]);

  const handleSuggestDetails = async () => {
    const title = form.getValues('title');
    const currentDescription = form.getValues('description');

    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Title Required',
        description: 'Please enter a task title before suggesting details.',
      });
      return;
    }

    setIsSuggestingDetails(true);
    try {
      const suggestions = await suggestTaskDetails({ title, currentDescription });
      form.setValue('description', suggestions.suggestedDescription, { shouldValidate: true });
      form.setValue('category', suggestions.suggestedCategory, { shouldValidate: true });
      form.setValue('priority', suggestions.suggestedPriority, { shouldValidate: true });
      toast({
        title: 'AI Suggestions Applied',
        description: 'Description, category, and priority have been updated by AI.',
      });
    } catch (error) {
      console.error('Error suggesting task details:', error);
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: error instanceof Error ? error.message : 'Could not get AI suggestions for details.',
      });
    } finally {
      setIsSuggestingDetails(false);
    }
  };

  const handleSuggestPriority = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');
    const currentPriority = form.getValues('priority');
    const dueDateValue = form.getValues('dueDate');
    const dueDate = dueDateValue ? format(dueDateValue, 'yyyy-MM-dd') : undefined;

    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Title Required',
        description: 'Please enter a task title before suggesting priority.',
      });
      return;
    }
    setIsSuggestingPriority(true);
    try {
      const suggestion = await suggestTaskPriority({ taskTitle: title, taskDescription: description, currentPriority, dueDate });
      toast({
        title: 'AI Priority Suggestion',
        description: (
          <div>
            <p>Suggested Priority: <strong className="capitalize">{suggestion.suggestedPriority}</strong></p>
            <p>Reasoning: {suggestion.reasoning}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                form.setValue('priority', suggestion.suggestedPriority, { shouldValidate: true });
                toast({ title: 'Priority Updated', description: `Task priority set to ${suggestion.suggestedPriority}.`});
              }}
            >
              Apply Suggested Priority
            </Button>
          </div>
        ),
        duration: 10000, 
      });
    } catch (error) {
      console.error('Error suggesting task priority:', error);
      toast({
        variant: 'destructive',
        title: 'Priority Suggestion Failed',
        description: error instanceof Error ? error.message : 'Could not get AI priority suggestion.',
      });
    } finally {
      setIsSuggestingPriority(false);
    }
  };

  const handleSuggestSubtasks = async () => {
    const taskTitle = form.getValues('title');
    const taskDescription = form.getValues('description');

    if (!taskTitle.trim()) {
      setSubtasksError('Please enter a task title before suggesting sub-tasks.');
      setSuggestedSubtasksList([]);
      return;
    }

    setIsSuggestingSubtasks(true);
    setSubtasksError(null);
    setSuggestedSubtasksList([]);
    try {
      const result = await suggestSubtasks({ taskTitle, taskDescription });
      if (result.suggestedSubtasks && result.suggestedSubtasks.length > 0) {
        setSuggestedSubtasksList(result.suggestedSubtasks);
        toast({
          title: 'AI Sub-task Suggestions Ready!',
          description: 'Review the suggested sub-tasks below.',
        });
      } else {
        setSuggestedSubtasksList([]);
        setSubtasksError('AI could not generate sub-tasks for this item, or no sub-tasks were suggested. Try rephrasing the title/description.');
      }
    } catch (error) {
      console.error('Error suggesting sub-tasks:', error);
      setSubtasksError(error instanceof Error ? error.message : 'Failed to get AI sub-task suggestions.');
      setSuggestedSubtasksList([]);
    } finally {
      setIsSuggestingSubtasks(false);
    }
  };


  const handleAddComment = () => {
    if (!newCommentText.trim() || !user) return;
    const newComment: Comment = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name || user.email,
      text: newCommentText.trim(),
      timestamp: new Date().toISOString(),
    };
    setCurrentComments(prev => [...prev, newComment]);
    setNewCommentText(""); 
  };


  const onSubmit = (data: TaskFormValues) => {
    const taskData = {
      ...data,
      dueDate: data.dueDate ? format(data.dueDate, 'yyyy-MM-dd') : undefined,
      assignedTo: data.assignedTo === UNASSIGNED_FORM_VALUE ? undefined : data.assignedTo,
      files: currentFiles,
      comments: currentComments, 
    };

    if (task && task.id) {
      updateTask(task.id, taskData);
      toast({ title: "Task Updated", description: `"${data.title}" has been updated.` });
    } else {
      addTask(taskData);
      toast({ title: "Task Created", description: `"${data.title}" has been added.` });
    }
    onOpenChange?.(false);
    form.reset();
    setCurrentFiles([]);
    setCurrentComments([]);
    setSuggestedSubtasksList([]);
    setSubtasksError(null);
    setNewCommentText("");
  };

  const handleFileAdd = () => {
    const newFile: TaskFile = {
      id: `file-${Date.now()}`,
      name: `document-${currentFiles.length + 1}.pdf`,
      url: '#',
      size: Math.floor(Math.random() * (2048 * 1024 - 100 * 1024 + 1)) + (100 * 1024),
      type: 'application/pdf',
    };
    setCurrentFiles(prev => [...prev, newFile]);
  };

  const handleFileRemove = (fileId: string) => {
    setCurrentFiles(prev => prev.filter(f => f.id !== fileId));
  };
  

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4 p-1">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register('title')} placeholder="e.g., Schedule team meeting" />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...form.register('description')} placeholder="Add more details about the task... or let AI suggest them!" rows={3}/>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSuggestDetails}
              disabled={isSuggestingDetails || !form.watch('title') || isSuggestingPriority || isSuggestingSubtasks }
              className="text-xs flex-1"
            >
              {isSuggestingDetails ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="mr-1 h-3 w-3" />
              )}
              AI Suggest Details
            </Button>
        </div>
        
        <Separator />

        <Card className="bg-muted/20 shadow-inner">
          <CardHeader className="pb-2 pt-4 px-4">
            <UiCardTitle className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Task Breakdown
            </UiCardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSuggestSubtasks}
              disabled={isSuggestingSubtasks || !form.watch('title') || isSuggestingDetails || isSuggestingPriority }
              className="w-full text-xs"
            >
              {isSuggestingSubtasks ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Brain className="mr-1 h-3 w-3" />
              )}
              Suggest Sub-tasks / Checklist
            </Button>
            {isSuggestingSubtasks && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating sub-task suggestions...</span>
              </div>
            )}
            {subtasksError && !isSuggestingSubtasks && (
              <Alert variant="destructive" className="my-2 text-xs">
                <AlertTitle className="text-sm">Error</AlertTitle>
                <AlertDescription>{subtasksError}</AlertDescription>
              </Alert>
            )}
            {suggestedSubtasksList.length > 0 && !isSuggestingSubtasks && !subtasksError && (
              <div className="mt-2 p-3 border rounded-md bg-background/50 text-sm max-h-32 overflow-y-auto">
                <p className="font-medium mb-1.5 text-muted-foreground text-xs">Suggested Sub-tasks/Checklist:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {suggestedSubtasksList.map((subtask, index) => (
                    <li key={index}>{subtask}</li>
                  ))}
                </ul>
              </div>
            )}
            {!isSuggestingSubtasks && !subtasksError && suggestedSubtasksList.length === 0 && !form.watch('title') && (
              <p className="text-xs text-muted-foreground text-center py-1">
                Enter a title to enable sub-task suggestions.
              </p>
            )}
             {!isSuggestingSubtasks && !subtasksError && suggestedSubtasksList.length === 0 && form.watch('title') && (
              <p className="text-xs text-muted-foreground text-center py-1">
                Click "Suggest Sub-tasks" for AI-powered breakdown.
              </p>
            )}
          </CardContent>
        </Card>
        
        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
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
            <div className="flex items-center gap-2">
              <Controller
                name="priority"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="priority" className="flex-grow">
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
              <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSuggestPriority}
                  disabled={isSuggestingPriority || !form.watch('title') || isSuggestingDetails || isSuggestingSubtasks }
                  title="AI Suggest Priority"
                  className="p-2"
                >
                  {isSuggestingPriority ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
            </div>
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
          <Label htmlFor="assignedTo">Assign to</Label>
          <Controller
              name="assignedTo"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={(selectedValueFromSelect) => {
                    if (selectedValueFromSelect === UNASSIGNED_SELECT_ITEM_VALUE) {
                      field.onChange(UNASSIGNED_FORM_VALUE);
                    } else {
                      field.onChange(selectedValueFromSelect);
                    }
                  }}
                  value={field.value === UNASSIGNED_FORM_VALUE || field.value === undefined ? UNASSIGNED_SELECT_ITEM_VALUE : field.value}
                >
                  <SelectTrigger id="assignedTo" className="w-full">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select user" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_SELECT_ITEM_VALUE}><em>Unassigned</em></SelectItem>
                    {assignableUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
        </div>

        <div>
          <Label>Files (Mock)</Label>
          <div className="space-y-2 mt-1">
            {currentFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/10">
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

        {task && task.id && ( 
          <>
            <Separator />
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" /> Comments
                    </h3>
                </div>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 border rounded-md p-3 bg-muted/20">
                {currentComments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No comments yet.</p>
                )}
                {currentComments.map(comment => (
                  <Card key={comment.id} className="bg-background shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2.5">
                        <Avatar className="h-8 w-8 text-xs">
                          <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{comment.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(comment.timestamp), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex items-start gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  rows={2}
                  className="flex-grow"
                  disabled={!user}
                />
                <Button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newCommentText.trim() || !user}
                  className="self-end"
                  size="icon"
                  title="Add Comment"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>


      <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
        <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting || isSuggestingDetails || isSuggestingSubtasks || isSuggestingPriority }>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (task ? 'Save Changes' : 'Create Task')}
        </Button>
      </div>
    </form>
  );
}
