
"use client";

import { KanbanColumn } from '@/components/tasks/kanban-column';
import { useTasks } from '@/contexts/task-context';
import { KANBAN_COLUMNS } from '@/lib/constants';
import type { Task, TaskStatus, RiskRadarOutput, RiskRadarInput, TaskSnapshot } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/task-form';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle as UiCardTitle } from '@/components/ui/card'; // Aliased CardTitle
import { Badge } from '@/components/ui/badge';
import { generateRiskRadar } from '@/ai/flows/generate-risk-radar-flow';

export default function DashboardPage() {
  const { tasks, getTasksByStatus, moveTask, isLoading: tasksLoading, error: taskError, setTasks: setGlobalTasks } = useTasks();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  // State for AI Risk Radar
  const [riskRadarData, setRiskRadarData] = useState<RiskRadarOutput | null>(null);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchRisks = async () => {
      if (tasksLoading || tasks.length === 0) {
        if(tasks.length === 0 && !tasksLoading) {
          setRiskRadarData({ risks: [] });
        }
        return;
      }
      setIsLoadingRisks(true);
      setRiskError(null);
      try {
        const taskSnapshots: TaskSnapshot[] = tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          description: t.description,
          assignedTo: t.assignedTo,
          category: t.category,
        }));
        const input: RiskRadarInput = { tasks: taskSnapshots };
        const result = await generateRiskRadar(input);
        setRiskRadarData(result);
      } catch (e) {
        console.error("Error fetching risk radar data:", e);
        setRiskError(e instanceof Error ? e.message : "Failed to fetch AI risk analysis.");
        setRiskRadarData(null);
      } finally {
        setIsLoadingRisks(false);
      }
    };

    if (isMounted && !tasksLoading) {
      fetchRisks();
    }
  }, [isMounted, tasks, tasksLoading]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const targetColumnElement = (e.target as HTMLElement).closest('[data-status-id]');
    if (!targetColumnElement) return;
    
    const tasksInTargetColumn = getTasksByStatus(targetStatus);
    let newOrder = tasksInTargetColumn.length;

    const dropTargetCard = (e.target as HTMLElement).closest('[role="button"]'); 
    if (dropTargetCard) {
        const siblingCards = Array.from(targetColumnElement.querySelectorAll('[role="button"]'));
        const dropIndex = siblingCards.indexOf(dropTargetCard);
        if (dropIndex !== -1) {
            newOrder = dropIndex;
        }
    }
    
    const currentTask = tasks.find(t => t.id === taskId);
    if (currentTask) {
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, status: targetStatus, order: newOrder, updatedAt: new Date().toISOString() };
        }
        return t;
      });

      if (currentTask.status !== targetStatus) {
        updatedTasks
          .filter(t => t.status === currentTask.status && t.id !== taskId)
          .sort((a, b) => a.order - b.order)
          .forEach((t, idx) => t.order = idx);
      }
      
      updatedTasks
        .filter(t => t.status === targetStatus)
        .sort((a, b) => a.order - b.order)
        .forEach((t, idx) => {
             if (t.id === taskId) { t.order = newOrder; } 
             else if (idx >= newOrder && t.id !== taskId) { t.order = idx +1; } 
             else {t.order = idx;}
        });
      
      const sortedUpdatedTasks = KANBAN_COLUMNS.reduce((acc, col) => {
        const columnTasks = updatedTasks.filter(t => t.status === col.id).sort((a,b) => a.order - b.order);
        columnTasks.forEach((t, idx) => t.order = idx); 
        return acc.concat(columnTasks);
      }, [] as Task[]);


      setGlobalTasks(sortedUpdatedTasks); 

      try {
        await moveTask(taskId, targetStatus, newOrder); 
        toast({ title: "Task Moved", description: `Task "${currentTask.title}" moved to ${KANBAN_COLUMNS.find(c=>c.id===targetStatus)?.title}.` });
      } catch (apiError) {
        toast({ variant: "destructive", title: "Move Failed", description: `Could not move task. ${ (apiError as Error).message }` });
      }
    }
  };


  if (!isMounted || (tasksLoading && !riskRadarData)) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (taskError) {
     return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Tasks</AlertTitle>
          <AlertDescription>{taskError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getRiskBadgeVariant = (level: 'High' | 'Medium' | 'Low' | undefined) => {
    switch (level) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="flex flex-col h-full p-2 md:p-4 space-y-4">
      {/* AI Risk Radar Card */}
      <Card className="shadow-lg border-primary/30">
        <CardHeader className="pb-3 pt-4 px-4">
          <UiCardTitle className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" /> AI Risk Radar
          </UiCardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoadingRisks && (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing risks...
            </div>
          )}
          {riskError && !isLoadingRisks && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Risk Analysis Error</AlertTitle>
              <AlertDescription>{riskError}</AlertDescription>
            </Alert>
          )}
          {!isLoadingRisks && !riskError && riskRadarData && riskRadarData.risks.length > 0 && (
            <ul className="space-y-2 text-sm">
              {riskRadarData.risks.map((risk, index) => (
                <li key={index} className="p-2 border rounded-md bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{risk.description}</span>
                    <Badge variant={getRiskBadgeVariant(risk.level)} className="capitalize">{risk.level}</Badge>
                  </div>
                  {risk.relatedTaskId && risk.relatedTaskTitle && (
                    <Link href={`/tasks?openTask=${risk.relatedTaskId}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      View Task: {risk.relatedTaskTitle} <ExternalLink className="h-3 w-3"/>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!isLoadingRisks && !riskError && (!riskRadarData || riskRadarData.risks.length === 0) && (
             tasks.length > 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No critical risks identified by AI at the moment. Great job!</p>
             ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Add some tasks to analyze risks.</p>
             )
          )}
        </CardContent>
      </Card>

      {/* Kanban Board container */}
      <div className="flex gap-4 md:gap-6 flex-1 overflow-x-auto"> 
        {KANBAN_COLUMNS.map(column => (
          <div 
            key={column.id} 
            className="flex-1 min-w-[300px] md:min-w-[320px] h-full"
            onDragOver={(e) => e.preventDefault()} 
            onDrop={(e) => handleDrop(e, column.id)} 
            data-status-id={column.id} 
          >
            <KanbanColumn
              status={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.id)}
              onTaskClick={handleTaskClick}
            />
          </div>
        ))}
      </div>

      {selectedTask && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[625px] max-h-[85vh] overflow-y-auto">
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
