
"use client";

import React, { useState, useMemo } from 'react';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isValid } from 'date-fns';
import { useTasks } from '@/contexts/task-context';
import type { Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as UICalendar } from '@/components/ui/calendar'; // Renamed to avoid conflict
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, ListFilter, PlusCircle } from 'lucide-react';
import { AddTaskButton } from '@/components/tasks/add-task-button';
import { TaskForm } from '@/components/tasks/task-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface DayWithTasks {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function CalendarPage() {
  const { tasks } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const calendarDaysWithTasks: DayWithTasks[] = useMemo(() => {
    return daysInMonth.map(day => ({
      date: day,
      tasks: tasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)) && isSameDay(parseISO(task.dueDate), day)),
      isCurrentMonth: true, // Simplified for this view, full calendar would handle prev/next month days
      isToday: isSameDay(day, new Date()),
    }));
  }, [daysInMonth, tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };
  
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)) && isSameDay(parseISO(task.dueDate), selectedDate));
  }, [selectedDate, tasks]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="container mx-auto py-2 md:py-6 flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
      <Card className="lg:w-2/3 shadow-lg flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" /> Task Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
               <AddTaskButton />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <UICalendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="p-0 rounded-md"
            classNames={{
              head_cell: "w-full text-muted-foreground rounded-md font-normal text-[0.8rem] capitalize",
              cell: "h-auto aspect-square text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              day: "h-full w-full p-1.5 font-normal aria-selected:opacity-100 justify-start items-start flex flex-col",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
              day_today: "bg-accent text-accent-foreground rounded-md",
              day_outside: "text-muted-foreground opacity-50",
            }}
            components={{
              DayContent: ({ date }) => {
                const dayTasks = tasks.filter(task => task.dueDate && isValid(parseISO(task.dueDate)) && isSameDay(parseISO(task.dueDate), date));
                return (
                  <>
                    <div>{format(date, 'd')}</div>
                    {dayTasks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dayTasks.slice(0, 2).map(task => (
                          <Badge key={task.id} variant="secondary" className="w-full text-xs truncate px-1 py-0.5">{task.title}</Badge>
                        ))}
                        {dayTasks.length > 2 && <Badge variant="outline" className="w-full text-xs px-1 py-0.5">+{dayTasks.length - 2} more</Badge>}
                      </div>
                    )}
                  </>
                );
              }
            }}
          />
        </CardContent>
      </Card>

      <Card className="lg:w-1/3 shadow-lg flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl">
            Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
          </CardTitle>
          <CardDescription>
            {selectedDate ? `Viewing tasks due on ${format(selectedDate, 'PPP')}.` : 'Select a date to see tasks.'}
          </CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow">
          <CardContent>
            {tasksForSelectedDate.length > 0 ? (
              <ul className="space-y-3">
                {tasksForSelectedDate.map(task => (
                  <li key={task.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => handleTaskClick(task)}>
                    <h4 className="font-semibold">{task.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                    <div className="flex items-center justify-between mt-1 text-xs">
                       <Badge variant={
                          task.priority === 'high' ? 'destructive' 
                          : task.priority === 'medium' ? 'secondary' 
                          : 'default'
                        }
                        className={cn({
                            'bg-red-100 text-red-700 dark:bg-red-800/70 dark:text-red-200': task.priority === 'high',
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/70 dark:text-yellow-200': task.priority === 'medium',
                            'bg-green-100 text-green-700 dark:bg-green-800/70 dark:text-green-200': task.priority === 'low',
                        })}
                       >
                         {task.priority}
                       </Badge>
                       <Badge variant={
                          task.status === 'done' ? 'default' 
                          : task.status === 'inprogress' ? 'secondary' 
                          : 'outline'
                        }
                         className={cn({
                            'bg-green-100 text-green-700 dark:bg-green-800/70 dark:text-green-200': task.status === 'done',
                            'bg-blue-100 text-blue-700 dark:bg-blue-800/70 dark:text-blue-200': task.status === 'inprogress',
                         })}
                       >
                         {task.status}
                       </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {selectedDate ? 'No tasks for this date.' : 'Select a date to view tasks.'}
              </p>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
      {selectedTask && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update the details for your task.
              </DialogDescription>
            </DialogHeader>
            <TaskForm task={selectedTask} onOpenChange={setIsEditModalOpen} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
