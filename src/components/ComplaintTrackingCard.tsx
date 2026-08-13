import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, RefreshCw, History, ShieldCheck, MapPin, Clock, AlertCircle } from 'lucide-react';
import { getAuthorityPortal } from '@/data/authorityPortals';
import { getTrackingEvents, recordStatusCheck, recordStatusUpdate } from '@/services/trackingService';
import ComplaintTimeline from '@/components/ComplaintTimeline';
import RecordStatusModal from '@/components/RecordStatusModal';
import type { Complaint, ComplaintTrackingEvent } from '@/types';

interface Props {
  complaint: Complaint;
  onUpdate?: () => void;
}

function formatLastChecked(events: ComplaintTrackingEvent[]): string {
  const checkOrUpdateEvts = events.filter(
    (e) => e.eventType === 'status_checked' || e.eventType === 'status_updated'
  );
  if (checkOrUpdateEvts.length === 0) return 'Not checked yet';

  const lastEvt = checkOrUpdateEvts[0];
  try {
    const d = new Date(lastEvt.createdAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ', ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch {
    // Fallback
  }
  return lastEvt.createdAt || 'Recently';
}

function getLatestStatusText(events: ComplaintTrackingEvent[], fallbackStatus: string): string {
  const statusEvts = events.filter((e) => e.eventType === 'status_updated' && e.status);
  if (statusEvts.length > 0 && statusEvts[0].status) {
    return statusEvts[0].status;
  }
  const checkedEvts = events.filter((e) => e.eventType === 'status_checked');
  if (checkedEvts.length > 0) {
    return 'Status Checked';
  }
  return fallbackStatus === 'in_progress' ? 'Not checked yet' : fallbackStatus;
}

export default function ComplaintTrackingCard({ complaint, onUpdate }: Props) {
  const [events, setEvents] = useState<ComplaintTrackingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'check' | 'record'>('check');

  const portalConfig = getAuthorityPortal(undefined, complaint.authority);
  const trackingUrl = complaint.authorityWebsite || portalConfig.statusUrl || portalConfig.complaintUrl;
  const hasReference = Boolean(complaint.referenceNumber);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const evts = await getTrackingEvents(complaint.id);
      setEvents(evts);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [complaint.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCheckOfficialStatus = async () => {
    if (!hasReference) return;
    // 1. Open official portal in new secure tab
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');

    // 2. Record status_checked event in Supabase
    await recordStatusCheck(complaint.id);
    await fetchEvents();

    // 3. Open modal explaining check and asking to record status
    setModalMode('check');
    setModalOpen(true);
  };

  const handleOpenUpdateModalDirectly = () => {
    setModalMode('record');
    setModalOpen(true);
  };

  const handleSaveStatus = async (status: string, note?: string) => {
    await recordStatusUpdate(complaint.id, status, note);
    await fetchEvents();
    if (onUpdate) onUpdate();
  };

  const lastCheckedText = formatLastChecked(events);
  const currentStatusText = getLatestStatusText(events, complaint.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl glass p-6 border border-accent-400/20 shadow-glow-soft space-y-5 hover:border-accent-400/40 transition-all text-left"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-accent-300">
            {complaint.category || 'Active Complaint'}
          </span>
          <h3 className="mt-1 text-lg font-semibold text-white">{complaint.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-none" />
            <span>{complaint.location}</span>
          </p>
        </div>

        {hasReference ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 border border-accent-400/20 px-3 py-1 text-xs font-mono font-semibold text-accent-300">
            <span className="h-2 w-2 rounded-full bg-accent-400 animate-breathe" />
            {complaint.referenceNumber}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
            <AlertCircle className="h-3.5 w-3.5" />
            Awaiting official reference number
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/[0.03] p-3.5 border border-white/5 space-y-1">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400 block">
            Target Authority
          </span>
          <span className="text-xs font-semibold text-white block line-clamp-1">
            {complaint.authority}
          </span>
        </div>

        <div className="rounded-2xl bg-white/[0.03] p-3.5 border border-white/5 space-y-1">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400 block">
            Current Status
          </span>
          <span className="text-xs font-semibold text-accent-300 block">
            {currentStatusText}
          </span>
        </div>

        <div className="rounded-2xl bg-white/[0.03] p-3.5 border border-white/5 space-y-1">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400 block">
            Last Checked by You
          </span>
          <span className="text-xs font-medium text-gray-300 flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-400 flex-none" />
            {lastCheckedText}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-2">
          {hasReference ? (
            <>
              <button
                onClick={handleCheckOfficialStatus}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
              >
                <span>Check Official Status</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={handleOpenUpdateModalDirectly}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-2 text-xs font-medium text-white transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Update Status</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">
              Official portal check available once reference number is added.
            </span>
          )}
        </div>

        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent-300 transition-colors ml-auto"
        >
          <History className="h-3.5 w-3.5" />
          <span>{showTimeline ? 'Hide Timeline' : 'View Timeline'}</span>
        </button>
      </div>

      {/* Collapsible Timeline View */}
      <AnimatePresence>
        {showTimeline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 border-t border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Persistent Citizen Timeline
              </h4>
              <span className="text-[11px] text-gray-400 font-mono">
                {events.length} event{events.length === 1 ? '' : 's'} recorded
              </span>
            </div>
            <ComplaintTimeline events={events} loading={loadingEvents} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <RecordStatusModal
        isOpen={modalOpen}
        mode={modalMode}
        authorityName={complaint.authority}
        referenceNumber={complaint.referenceNumber}
        portalDomain={portalConfig.domain}
        onClose={() => setModalOpen(false)}
        onProceedToRecord={() => setModalMode('record')}
        onSaveStatus={handleSaveStatus}
      />
    </motion.div>
  );
}
