
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-tasks.ts';
import '@/ai/flows/suggest-task-details-flow.ts';
import '@/ai/flows/generate-task-image-flow.ts'; // Ensure this line is present
