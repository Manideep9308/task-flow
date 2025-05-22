
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-tasks.ts';
import '@/ai/flows/suggest-task-details-flow.ts';
// Removed: import '@/ai/flows/generate-task-image-flow.ts';
import '@/ai/flows/generate-standup-summary-flow.ts';
import '@/ai/flows/predict-timeline-impact-flow.ts'; // Ensure this line is present and correct
