import type { ComplaintTrackingEvent, TrackingEventType } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { updateComplaint, getComplaint } from '@/services/complaintService';

const TRACKING_STORAGE_KEY = 'naagrik_user_tracking_events';

function getStoredTrackingEvents(): ComplaintTrackingEvent[] {
  try {
    const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage parse errors
  }
  return [];
}

function saveStoredTrackingEvents(events: ComplaintTrackingEvent[]) {
  try {
    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Record a new tracking event for a complaint in Supabase DB (with local storage fallback)
 */
export async function createTrackingEvent(payload: {
  complaintId: string;
  eventType: TrackingEventType;
  status?: string;
  note?: string;
}): Promise<ComplaintTrackingEvent> {
  const isoNow = new Date().toISOString();
  let generatedId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let userId: string | undefined = undefined;

  if (isSupabaseConfigured) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      if (currentUser) {
        userId = currentUser.id;
        const { data, error } = await supabase
          .from('complaint_tracking_events')
          .insert({
            complaint_id: payload.complaintId,
            user_id: currentUser.id,
            event_type: payload.eventType,
            status: payload.status || null,
            note: payload.note || null,
          })
          .select('id, created_at')
          .single();

        if (!error && data?.id) {
          generatedId = data.id;
        }
      }
    } catch {
      // Storage fallback
    }
  }

  const newEvent: ComplaintTrackingEvent = {
    id: generatedId,
    complaintId: payload.complaintId,
    userId,
    eventType: payload.eventType,
    status: payload.status,
    note: payload.note,
    createdAt: isoNow,
  };

  const stored = getStoredTrackingEvents();
  saveStoredTrackingEvents([newEvent, ...stored]);

  return newEvent;
}

/**
 * Fetch all tracking events for a complaint from Supabase DB (with local fallback)
 * Guarantees a clear chronological timeline.
 */
export async function getTrackingEvents(complaintId: string): Promise<ComplaintTrackingEvent[]> {
  let events: ComplaintTrackingEvent[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data, error } = await supabase
          .from('complaint_tracking_events')
          .select('*')
          .eq('complaint_id', complaintId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          events = data.map((row) => ({
            id: row.id,
            complaintId: row.complaint_id,
            userId: row.user_id,
            eventType: row.event_type as TrackingEventType,
            status: row.status || undefined,
            note: row.note || undefined,
            createdAt: row.created_at,
          }));
        }
      }
    } catch {
      // Fallback
    }
  }

  // Merge with local storage fallback
  const localEvents = getStoredTrackingEvents().filter((e) => e.complaintId === complaintId);
  const existingIds = new Set(events.map((e) => e.id));
  for (const loc of localEvents) {
    if (!existingIds.has(loc.id)) {
      events.push(loc);
    }
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // If no events exist yet, auto-seed default baseline events (complaint_created / reference_saved)
  if (events.length === 0) {
    const complaint = await getComplaint(complaintId);
    if (complaint) {
      const defaultCreatedAt = complaint.createdAt || new Date().toISOString();

      const createdEvent: ComplaintTrackingEvent = {
        id: `auto_created_${complaintId}`,
        complaintId,
        eventType: 'complaint_created',
        createdAt: defaultCreatedAt,
      };

      events.push(createdEvent);

      if (complaint.referenceNumber) {
        const refEvent: ComplaintTrackingEvent = {
          id: `auto_ref_${complaintId}`,
          complaintId,
          eventType: 'reference_saved',
          note: `Official reference: ${complaint.referenceNumber}`,
          createdAt: defaultCreatedAt,
        };
        events.unshift(refEvent); // newer than created
      }
    }
  }

  return events;
}

/**
 * Record a citizen status check action
 */
export async function recordStatusCheck(complaintId: string): Promise<ComplaintTrackingEvent> {
  return createTrackingEvent({
    complaintId,
    eventType: 'status_checked',
  });
}

/**
 * Record a citizen status update with status label and optional note
 */
export async function recordStatusUpdate(
  complaintId: string,
  status: string,
  note?: string
): Promise<ComplaintTrackingEvent> {
  // Update complaint record state as well
  await updateComplaint(complaintId, {
    status: status.toLowerCase().includes('resolve')
      ? 'resolved'
      : status.toLowerCase().includes('progress')
      ? 'in_progress'
      : 'monitoring',
  });

  return createTrackingEvent({
    complaintId,
    eventType: 'status_updated',
    status,
    note,
  });
}

/**
 * Record official reference number saving
 */
export async function recordReferenceSaved(
  complaintId: string,
  referenceNumber: string
): Promise<ComplaintTrackingEvent> {
  await updateComplaint(complaintId, {
    referenceNumber,
    status: 'monitoring',
  });

  return createTrackingEvent({
    complaintId,
    eventType: 'reference_saved',
    note: `Official reference: ${referenceNumber}`,
  });
}

/**
 * Record complaint created event
 */
export async function recordComplaintCreated(complaintId: string): Promise<ComplaintTrackingEvent> {
  return createTrackingEvent({
    complaintId,
    eventType: 'complaint_created',
  });
}
