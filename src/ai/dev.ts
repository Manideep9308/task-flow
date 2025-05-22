
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-tasks.ts';
import '@/ai/flows/suggest-task-details-flow.ts';
import '@/ai/flows/generate-standup-summary-flow.ts';
import '@/ai/flows/predict-timeline-impact-flow.ts';
import '@/ai/flows/suggest-subtasks-flow.ts';
import '@/ai/flows/suggest-task-priority-flow.ts'; // Added new flow

