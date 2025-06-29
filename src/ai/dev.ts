
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-tasks.ts';
import '@/ai/flows/suggest-task-details-flow.ts';
import '@/ai/flows/generate-standup-summary-flow.ts';
import '@/ai/flows/predict-timeline-impact-flow.ts';
import '@/ai/flows/suggest-subtasks-flow.ts';
import '@/ai/flows/suggest-task-priority-flow.ts';
import '@/ai/flows/suggest-chat-replies-flow.ts'; 
import '@/ai/flows/generate-chat-highlights-flow.ts'; 
import '@/ai/flows/generate-project-health-report-flow.ts';
import '@/ai/flows/app-assistant-flow.ts';
import '@/ai/flows/generate-retrospective-report-flow.ts';
import '@/ai/flows/validate-project-premise-flow.ts';
import '@/ai/flows/estimate-project-scope-flow.ts'; // Added new flow
// import '@/ai/flows/generate-meeting-prep-briefing-flow.ts'; // Removed this flow
