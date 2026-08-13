import type { Complaint, ComplaintStage } from '@/types';
import { COMPLAINTS } from '@/data/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getAuthorityPortal } from '@/data/authorityPortals';

const STORAGE_KEY = 'naagrik_user_complaints';

function getStoredComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage parse errors
  }
  return [];
}

function saveStoredComplaints(list: Complaint[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage write errors
  }
}

export function generateDynamicComplaintId(authority?: string, title?: string): string {
  let prefix = 'NGK';
  if (authority) {
    const lower = authority.toLowerCase();
    if (lower.includes('mcd')) prefix = 'MCD';
    else if (lower.includes('bses')) prefix = 'BSES';
    else if (lower.includes('jal board') || lower.includes('djb')) prefix = 'DJB';
    else if (lower.includes('pwd')) prefix = 'PWD';
    else if (lower.includes('dda')) prefix = 'DDA';
    else if (lower.includes('police')) prefix = 'TPD';
    else if (lower.includes('nhai')) prefix = 'NHAI';
  } else if (title) {
    prefix = title.slice(0, 3).toUpperCase();
  }
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-2026-${randomNum}`;
}

/**
 * Submit / Persist a complaint record to Supabase (or session storage fallback)
 */
export async function submitComplaint(payload: {
  title?: string;
  description: string;
  complaintLetter?: string;
  category: string;
  authority: string;
  authorityWebsite?: string;
  location: string;
  locationData?: any;
  evidenceCount: number;
  referenceNumber?: string;
}): Promise<{ id: string }> {
  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const localId = payload.referenceNumber || generateDynamicComplaintId(payload.authority, payload.title);

  const defaultStages: ComplaintStage[] = [
    { id: 'reported', label: 'Reported', status: 'done', timestamp: now },
    { id: 'registered', label: 'Registered', status: 'done', timestamp: now },
    { id: 'assigned', label: 'Assigned', status: 'current', timestamp: 'In progress' },
    { id: 'in_progress', label: 'In Progress', status: 'upcoming' },
    { id: 'resolved', label: 'Resolved', status: 'upcoming' },
  ];

  let insertedId = localId;

  // Supabase Cloud DB Persistence if user is authenticated
  if (isSupabaseConfigured) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      if (currentUser) {
        const portalConfig = getAuthorityPortal(undefined, payload.authority);
        const { data, error } = await supabase
          .from('complaints')
          .insert({
            user_id: currentUser.id,
            issue_title: payload.title || payload.description.slice(0, 40) + '…',
            category: payload.category || 'General Civic Issue',
            authority_key: portalConfig.authorityKey,
            authority_name: payload.authority || portalConfig.authority,
            location: payload.location || 'Location Not Specified',
            original_complaint: payload.description,
            final_complaint: payload.complaintLetter,
            reference_number: payload.referenceNumber || null,
            status: 'in_progress',
            evidence_count: payload.evidenceCount || 0,
          })
          .select('id')
          .single();

        if (!error && data?.id) {
          insertedId = data.id;
        }
      }
    } catch {
      // Fallback to local session storage
    }
  }

  const newComplaint: Complaint = {
    id: insertedId,
    title: payload.title || payload.description.slice(0, 40) + (payload.description.length > 40 ? '…' : ''),
    description: payload.description,
    complaintLetter: payload.complaintLetter,
    category: payload.category as any || 'General Civic Issue',
    authority: payload.authority || 'Local Municipal Authority',
    authorityWebsite: payload.authorityWebsite,
    location: payload.location || 'Location Not Specified',
    locationData: payload.locationData,
    status: 'in_progress',
    evidenceCount: payload.evidenceCount || 0,
    createdAt: `Just now · ${now}`,
    lastUpdated: 'Just now',
    lastChecked: 'Just now',
    referenceNumber: payload.referenceNumber,
    stages: defaultStages,
  };

  const stored = getStoredComplaints();
  saveStoredComplaints([newComplaint, ...stored]);

  // Record initial tracking events asynchronously
  createInitialTrackingEvents(insertedId, payload.referenceNumber).catch(() => {});

  return { id: insertedId };
}

async function createInitialTrackingEvents(complaintId: string, referenceNumber?: string) {
  try {
    const { recordComplaintCreated, recordReferenceSaved } = await import('@/services/trackingService');
    await recordComplaintCreated(complaintId);
    if (referenceNumber) {
      await recordReferenceSaved(complaintId, referenceNumber);
    }
  } catch {
    // Ignore tracking record errors
  }
}

/**
 * Get complaint by ID from Supabase or local storage
 */
export async function getComplaint(id: string): Promise<Complaint | undefined> {
  const stored = getStoredComplaints();
  const foundInStored = stored.find((c) => c.id === id || c.referenceNumber === id);
  if (foundInStored) return foundInStored;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .or(`id.eq.${id},reference_number.eq.${id}`)
        .maybeSingle();

      if (!error && data) {
        const portalConfig = getAuthorityPortal(data.authority_key, data.authority_name);
        return {
          id: data.id,
          title: data.issue_title,
          description: data.original_complaint || data.final_complaint || '',
          complaintLetter: data.final_complaint,
          category: data.category,
          authority: data.authority_name,
          authorityWebsite: portalConfig.complaintUrl,
          location: data.location,
          status: data.status || 'in_progress',
          evidenceCount: data.evidence_count || 0,
          createdAt: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          lastUpdated: 'Recently updated',
          lastChecked: 'Official portal status',
          referenceNumber: data.reference_number || undefined,
          stages: [
            { id: 'reported', label: 'Reported', status: 'done', timestamp: 'Verified' },
            { id: 'registered', label: 'Registered', status: 'done', timestamp: 'Verified' },
            { id: 'assigned', label: 'Assigned', status: 'current', timestamp: 'In progress' },
            { id: 'in_progress', label: 'In Progress', status: 'upcoming' },
            { id: 'resolved', label: 'Resolved', status: 'upcoming' },
          ],
        };
      }
    } catch {
      // Fallback
    }
  }

  return COMPLAINTS.find((c) => c.id === id);
}

/**
 * List all complaints belonging to the current user (Supabase cloud + local fallback)
 */
export async function listComplaints(): Promise<Complaint[]> {
  const localList = getStoredComplaints();

  if (isSupabaseConfigured) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteList: Complaint[] = data.map((row) => {
            const portalConfig = getAuthorityPortal(row.authority_key, row.authority_name);
            return {
              id: row.id,
              title: row.issue_title,
              description: row.original_complaint || row.final_complaint || '',
              complaintLetter: row.final_complaint,
              category: row.category,
              authority: row.authority_name,
              authorityWebsite: portalConfig.complaintUrl,
              location: row.location,
              status: row.status || 'in_progress',
              evidenceCount: row.evidence_count || 0,
              createdAt: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              lastUpdated: 'Recently',
              lastChecked: 'Just now',
              referenceNumber: row.reference_number || undefined,
              stages: [
                { id: 'reported', label: 'Reported', status: 'done' },
                { id: 'registered', label: 'Registered', status: 'done' },
                { id: 'assigned', label: 'Assigned', status: 'current' },
                { id: 'in_progress', label: 'In Progress', status: 'upcoming' },
                { id: 'resolved', label: 'Resolved', status: 'upcoming' },
              ],
            };
          });

          // Merge without duplicate IDs
          const existingIds = new Set(remoteList.map((r) => r.id));
          const uniqueLocal = localList.filter((l) => !existingIds.has(l.id));
          return [...remoteList, ...uniqueLocal];
        }
      }
    } catch {
      // Fallback to localList
    }
  }

  return [...localList, ...COMPLAINTS];
}

export function isUserCreatedComplaint(id: string): boolean {
  const stored = getStoredComplaints();
  if (stored.some((c) => c.id === id)) return true;
  return true; // Cloud complaints are user-created
}

/**
 * Update complaint in Supabase DB and local storage
 */
export async function updateComplaint(id: string, updatedFields: Partial<Complaint>): Promise<Complaint | undefined> {
  const stored = getStoredComplaints();
  const index = stored.findIndex((c) => c.id === id);
  if (index !== -1) {
    const updated = {
      ...stored[index],
      ...updatedFields,
      lastUpdated: 'Just now',
    };
    stored[index] = updated;
    saveStoredComplaints(stored);
  }

  if (isSupabaseConfigured) {
    try {
      const dbPayload: any = {};
      if (updatedFields.title) dbPayload.issue_title = updatedFields.title;
      if (updatedFields.category) dbPayload.category = updatedFields.category;
      if (updatedFields.location) dbPayload.location = updatedFields.location;
      if (updatedFields.description) dbPayload.original_complaint = updatedFields.description;
      if (updatedFields.complaintLetter) dbPayload.final_complaint = updatedFields.complaintLetter;
      if (updatedFields.referenceNumber) dbPayload.reference_number = updatedFields.referenceNumber;
      if (updatedFields.status) dbPayload.status = updatedFields.status;

      dbPayload.updated_at = new Date().toISOString();

      await supabase.from('complaints').update(dbPayload).eq('id', id);
    } catch {
      // Storage fallback
    }
  }

  return getComplaint(id);
}

/**
 * Delete complaint from Supabase DB and local storage
 */
export async function deleteComplaint(id: string): Promise<boolean> {
  const stored = getStoredComplaints();
  const filtered = stored.filter((c) => c.id !== id);
  saveStoredComplaints(filtered);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('complaints').delete().eq('id', id);
    } catch {
      // Storage fallback
    }
  }

  return true;
}
