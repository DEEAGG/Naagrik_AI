import type {
  AgentActivity,
  AgentPlanStep,
  Complaint,
  ExecutionStep,
  ProcessingStep,
} from '@/types';

export const SUGGESTIONS = [
  'Streetlight not working',
  "Garbage hasn't been collected",
  "There's a pothole near my house",
  'Water supply issue',
] as const;

export const SAMPLE_COMPLAINT =
  "The garbage hasn't been collected from my street for four days.";

export const PROCESSING_STEPS: ProcessingStep[] = [
  { id: 'understand', label: 'Understanding what happened', status: 'pending' },
  { id: 'identify', label: 'Identifying the issue', status: 'pending' },
  { id: 'authority', label: 'Finding the responsible authority', status: 'pending' },
  { id: 'prepare', label: 'Preparing the next action', status: 'pending' },
];

export const AGENT_PLAN: AgentPlanStep[] = [
  { id: 'p1', label: 'Understand and normalize your complaint' },
  { id: 'p2', label: 'Identify the responsible authority' },
  { id: 'p3', label: 'Prepare a professional English complaint' },
  { id: 'p4', label: 'Let you review and edit the details' },
  { id: 'p5', label: 'Take you to the official government portal' },
  { id: 'p6', label: 'Link your official complaint/reference number' },
  { id: 'p7', label: 'Help you track the complaint from one place' },
];

export const EXECUTION_STEPS: ExecutionStep[] = [
  { id: 'e1', label: 'Complaint understood & normalized', status: 'done' },
  { id: 'e2', label: 'Authority & portal identified', status: 'done' },
  { id: 'e3', label: 'Professional complaint prepared', status: 'done' },
  { id: 'e4', label: 'Official portal handoff ready', status: 'done' },
  { id: 'e5', label: 'Official reference number linked', status: 'active' },
  { id: 'e6', label: 'Complaint tracking initialized', status: 'pending' },
];

export const NEW_COMPLAINT_ID = 'MCD-2026-18427';

export const COMPLAINTS: Complaint[] = [];

export const STALLED_COMPLAINT: Complaint = {
  ...COMPLAINTS[1],
  id: 'MCD-2026-18304',
  title: 'Streetlight not working',
  status: 'monitoring',
  stalledDays: 3,
  lastChecked: '6 hours ago',
  stages: [
    { id: 'reported', label: 'Reported', status: 'done', timestamp: '9:10 PM' },
    { id: 'registered', label: 'Registered', status: 'done', timestamp: '9:14 PM' },
    { id: 'assigned', label: 'Assigned', status: 'current', timestamp: 'Aug 9' },
    { id: 'in_progress', label: 'In Progress', status: 'upcoming' },
    { id: 'resolved', label: 'Resolved', status: 'upcoming' },
  ],
};

export const AGENT_ACTIVITY: AgentActivity[] = [
  { id: 'a1', time: '10:42 PM', action: 'Understood your complaint', status: 'done', kind: 'understand' },
  { id: 'a2', time: '10:42 PM', action: 'Identified sanitation issue', status: 'done', kind: 'identify' },
  { id: 'a3', time: '10:43 PM', action: 'Matched issue with MCD', status: 'done', kind: 'match' },
  { id: 'a4', time: '10:44 PM', action: 'Prepared complaint', status: 'done', kind: 'prepare' },
  { id: 'a5', time: '10:45 PM', action: 'Waiting for verification', status: 'done', kind: 'verify' },
  { id: 'a6', time: '10:47 PM', action: 'Complaint submitted', status: 'done', kind: 'submit' },
  { id: 'a7', time: '11:20 PM', action: 'Checked complaint status', status: 'active', kind: 'monitor' },
];
