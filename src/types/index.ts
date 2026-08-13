export type ComplaintStatus = 'pending' | 'monitoring' | 'in_progress' | 'resolved';

export type TrackingEventType = 'complaint_created' | 'reference_saved' | 'status_checked' | 'status_updated';

export interface ComplaintTrackingEvent {
  id: string;
  complaintId: string;
  userId?: string;
  eventType: TrackingEventType;
  status?: string;
  note?: string;
  createdAt: string;
}

export type IssueCategory =
  | 'Sanitation'
  | 'Street Lighting'
  | 'Roads'
  | 'Water'
  | 'Electricity'
  | 'Drainage'
  | 'Public Safety'
  | 'Stray Animals'
  | 'Parks & Open Spaces'
  | 'Encroachment'
  | 'Noise Pollution'
  | 'Public Sanitation'
  | 'Traffic & Transport'
  | (string & {});

export type LocationSource = 'manual' | 'saved' | 'gps' | 'extracted' | 'unspecified';

export interface LocationData {
  address: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: number;
  source: LocationSource;
  savedLocationName?: string;
  landmark?: string;
  houseNumber?: string;
  buildingName?: string;
  pincode?: string;
}

export interface SavedLocation {
  id: string;
  name: string; // e.g. "Home", "Work", "College"
  address: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  landmark?: string;
  houseNumber?: string;
  buildingName?: string;
  pincode?: string;
  createdAt: number;
}

export type StageId = 'reported' | 'registered' | 'assigned' | 'in_progress' | 'resolved';

export interface ComplaintStage {
  id: StageId;
  label: string;
  status: 'done' | 'current' | 'upcoming';
  timestamp?: string;
}

export interface ComplaintDraft {
  id: string;
  title: string;
  description: string;
  complaintLetter?: string;
  category: string;
  authority: string;
  authorityWebsite?: string;
  location: string;
  locationData?: LocationData;
  referenceNumber?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  complaintLetter?: string;
  category: IssueCategory;
  authority: string;
  authorityWebsite?: string;
  location: string;
  locationData?: LocationData;
  status: ComplaintStatus;
  evidenceCount: number;
  createdAt: string;
  lastUpdated: string;
  stages: ComplaintStage[];
  lastChecked?: string;
  stalledDays?: number;
  referenceNumber?: string;
}

export interface AgentActivity {
  id: string;
  time: string;
  action: string;
  status: 'done' | 'active' | 'pending';
  kind: 'understand' | 'identify' | 'match' | 'prepare' | 'verify' | 'submit' | 'monitor';
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'done' | 'active' | 'pending';
}

export interface AnalysisResult {
  issueTitle: string;
  issue: string; // Alias for issueTitle
  category: IssueCategory;
  subcategory?: string;
  authority: string;
  authorityWebsite?: string;
  location: string;
  locationData?: LocationData;
  description: string;
  complaintLetter?: string;
  status?: 'sufficient' | 'needs_clarification' | 'multi_issue';
  isSufficient?: boolean;
  needsClarification?: boolean;
  isOptionalEnhancement?: boolean;
  missingOptionalDetails?: string[];
  clarificationQuestion?: string;
  suggestedOptions?: string[];
  multiIssueDetected?: boolean;
  detectedIssues?: ComplaintDraft[];
  confidence?: 'high' | 'medium' | 'low';
  providerUsed?: string;
}

export interface AuthorityGroup {
  authority: string;
  authorityWebsite?: string;
  drafts: ComplaintDraft[];
}

export interface MultiIssueQueueState {
  mode: 'separate' | 'combine';
  drafts: ComplaintDraft[];
  currentIndex: number;
  completedIds: string[];
  failedIndices: number[];
  authorityGroups?: AuthorityGroup[];
}

export interface AgentPlanStep {
  id: string;
  label: string;
}

export interface ExecutionStep {
  id: string;
  label: string;
  status: 'done' | 'active' | 'pending';
}
