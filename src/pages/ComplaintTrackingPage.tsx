import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, AlertTriangle, Sparkles, ArrowRight, X, ShieldCheck } from 'lucide-react';
import CivicBackground from '@/components/CivicBackground';
import ComplaintJourney from '@/components/ComplaintJourney';
import AgentStatus from '@/components/AgentStatus';
import WorkflowProgress from '@/components/WorkflowProgress';
import ComplaintTimeline from '@/components/ComplaintTimeline';
import RecordStatusModal from '@/components/RecordStatusModal';
import { getComplaint } from '@/services/complaintService';
import { getAuthorityPortal } from '@/data/authorityPortals';
import { getTrackingEvents, recordStatusCheck, recordStatusUpdate } from '@/services/trackingService';
import { COMPLAINTS, STALLED_COMPLAINT } from '@/data/mockData';
import type { Complaint, ComplaintTrackingEvent } from '@/types';

export default function ComplaintTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [events, setEvents] = useState<ComplaintTrackingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [showFollowup, setShowFollowup] = useState<boolean>(false);

  // Status Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'check' | 'record'>('check');

  const loadData = useCallback(async () => {
    if (!id) return;
    const found =
      (await getComplaint(id)) ||
      COMPLAINTS.find((c) => c.id === id) ||
      (id === STALLED_COMPLAINT.id ? STALLED_COMPLAINT : null);

    if (found) {
      setComplaint(found);
      setLoadingEvents(true);
      try {
        const evts = await getTrackingEvents(found.id);
        setEvents(evts);
      } catch {
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!complaint) {
    return (
      <div className="relative min-h-screen">
        <CivicBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center text-gray-400 text-sm">
          Complaint record not found.
        </div>
      </div>
    );
  }

  const portalConfig = getAuthorityPortal(undefined, complaint.authority);
  const trackingUrl = complaint.authorityWebsite || portalConfig.statusUrl || portalConfig.complaintUrl;
  const officialRefNum = complaint.referenceNumber || complaint.id;
  const stalled = complaint.stalledDays && complaint.stalledDays >= 3;

  const handleCheckOfficialStatus = async () => {
    // 1. Open official portal in new secure tab
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');

    // 2. Record status_checked event in Supabase
    await recordStatusCheck(complaint.id);
    await loadData();

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
    await loadData();
  };

  const latestStatusEvt = events.find((e) => e.eventType === 'status_updated' && e.status);
  const currentCitizenStatus = latestStatusEvt?.status || (complaint.referenceNumber ? 'In Progress' : 'Awaiting Reference');

  return (
    <div className="relative min-h-screen text-left">
      <CivicBackground />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-3xl px-4 pt-24 pb-16"
      >
        {/* 4-STEP WORKFLOW PROGRESS */}
        <WorkflowProgress currentStep={4} />

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to issues
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              {complaint.title}
            </h1>
            <p className="mt-2 font-mono text-sm tracking-wider text-accent-300">
              Ref: {officialRefNum}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 border border-accent-400/20 px-3.5 py-1.5 text-xs font-medium text-accent-300">
            <span className="h-2 w-2 rounded-full bg-accent-400 animate-breathe" />
            {complaint.referenceNumber ? 'Official Reference Saved' : 'Awaiting Reference'}
          </span>
        </div>

        {/* Journey */}
        <div className="mt-8 rounded-3xl glass p-6 sm:p-8">
          <ComplaintJourney stages={complaint.stages} />
        </div>

        {/* READY FOR OFFICIAL TRACKING CARD */}
        <div className="mt-6 rounded-3xl glass p-6 sm:p-8 border border-accent-400/30 space-y-5 shadow-glow-soft">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent-300" />
              <h2 className="text-lg font-semibold text-white uppercase tracking-wider">
                OFFICIAL COMPLAINT TRACKING
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-mono">{portalConfig.domain}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5 space-y-1">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block">
                Authority
              </span>
              <span className="text-sm font-semibold text-white">{complaint.authority}</span>
            </div>

            <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5 space-y-1">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block">
                Official Reference Number
              </span>
              <span className="text-sm font-mono font-semibold text-accent-300">
                {officialRefNum}
              </span>
            </div>

            <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5 space-y-1">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block">
                Current Status
              </span>
              <span className="text-sm font-semibold text-accent-300">
                {currentCitizenStatus}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <p className="text-xs text-gray-300 leading-relaxed flex-1">
              Status is checked through the official authority. Naagrik AI does not fabricate or estimate complaint status.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCheckOfficialStatus}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all flex-none"
              >
                <span>Check Official Status ↗</span>
              </button>
              <button
                onClick={handleOpenUpdateModalDirectly}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2.5 text-xs font-medium text-white transition-all flex-none"
              >
                <span>Update Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* TIMELINE SECTION */}
        <div className="mt-8 rounded-3xl glass p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent-300" />
              <h2 className="text-lg font-semibold text-white uppercase tracking-wider">
                COMPLAINT TIMELINE
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              Persistent Cloud History
            </span>
          </div>

          <ComplaintTimeline events={events} loading={loadingEvents} />
        </div>

        {/* Monitoring Info Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl glass p-5">
            <div className="flex items-center gap-2 text-accent-300">
              <AgentStatus label="Naagrik tracking state" />
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">Last checked by you</dt>
                <dd className="text-gray-200">
                  {events.find((e) => e.eventType === 'status_checked' || e.eventType === 'status_updated')
                    ? new Date(
                        events.find((e) => e.eventType === 'status_checked' || e.eventType === 'status_updated')!
                          .createdAt
                      ).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                    : 'Not checked yet'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Category</dt>
                <dd className="text-gray-200">{complaint.category}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl glass p-5">
            <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck className="h-4 w-4 text-success-400" />
              <span className="text-xs font-semibold tracking-wider uppercase text-gray-300">Authority Verification</span>
            </div>
            <p className="mt-3 text-xs text-gray-400 leading-relaxed">
              Your grievance was formatted according to official {complaint.authority} guidelines. Use the official status button above to check live department updates.
            </p>
          </div>
        </div>

        {/* Delay detection */}
        <AnimatePresence>
          {stalled && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 rounded-2xl border border-pending-500/30 bg-pending-500/5 p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-pending-500/15 text-pending-400">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">Something may need attention</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Your complaint has remained in the same state for {complaint.stalledDays} days.
                  </p>
                  <button
                    onClick={() => setShowFollowup(true)}
                    className="group mt-4 inline-flex items-center gap-2 rounded-full bg-pending-500/15 border border-pending-500/30 px-4 py-2 text-sm font-medium text-pending-400 hover:bg-pending-500/20 transition-colors"
                  >
                    Review next action
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metadata Footer */}
        <div className="mt-6 space-y-2 rounded-2xl glass p-5 text-xs text-gray-400">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="inline-flex items-center gap-1.5 font-medium text-gray-300">
              <Clock className="h-3.5 w-3.5 text-accent-400" /> Reported {complaint.createdAt}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-semibold">{complaint.authority}</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <span className="text-gray-400">Location Address:</span>
            <span className="text-white font-medium text-right">{complaint.locationData?.address || complaint.location}</span>
          </div>

          {complaint.locationData?.latitude !== undefined && complaint.locationData?.longitude !== undefined && (
            <div className="flex items-start justify-between gap-3 pt-1 border-t border-white/5 text-accent-300 font-mono text-[11px]">
              <span>Device GPS: {complaint.locationData.latitude.toFixed(4)}° N, {complaint.locationData.longitude.toFixed(4)}° E</span>
              {complaint.locationData.accuracy && <span>(~{complaint.locationData.accuracy} m accuracy)</span>}
            </div>
          )}
        </div>
      </motion.div>

      {/* Follow-up modal */}
      <AnimatePresence>
        {showFollowup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm"
              onClick={() => setShowFollowup(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl glass-strong p-6 text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-accent-300">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs font-semibold tracking-wider uppercase">Proactive agent</span>
                </div>
                <button onClick={() => setShowFollowup(false)} className="text-gray-500 hover:text-white" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">
                Naagrik can prepare a follow-up for you.
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Based on the delay, I can draft an escalation referencing your original
                complaint and the time elapsed. You'll review it before anything is sent.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowFollowup(false)}
                  className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Not now
                </button>
                <button className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-sm font-medium text-white hover:-translate-y-0.5 transition-all">
                  Prepare follow-up
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Record Status Modal */}
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
    </div>
  );
}
