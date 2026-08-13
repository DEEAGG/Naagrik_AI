import type { AnalysisResult, ProcessingStep, LocationData } from '@/types';
import { PROCESSING_STEPS } from '@/data/mockData';
import { analyzeComplaintWithAI } from './aiService';

export interface AnalyzeInput {
  text: string;
  evidenceCount?: number;
  userLocation?: string;
  userLocationData?: LocationData;
  contextChoice?: string;
}

export async function analyzeComplaint(input: AnalyzeInput): Promise<AnalysisResult> {
  return analyzeComplaintWithAI(input);
}

export function getProcessingSteps(): ProcessingStep[] {
  return PROCESSING_STEPS.map((s) => ({ ...s }));
}

export async function runProcessing(
  steps: ProcessingStep[],
  onStep: (steps: ProcessingStep[]) => void,
  stepDelay = 200,
): Promise<ProcessingStep[]> {
  const current = steps.map((s) => ({ ...s }));
  for (let i = 0; i < current.length; i++) {
    current[i].status = 'active';
    onStep([...current]);
    await delay(stepDelay);
    current[i].status = 'done';
    onStep([...current]);
  }
  return current;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
