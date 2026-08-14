import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, Clock, ShieldCheck, Sparkles, Filter } from 'lucide-react';
import CivicBackground from '@/components/CivicBackground';
import AgentStatus from '@/components/AgentStatus';
import ComplaintTrackingCard from '@/components/ComplaintTrackingCard';
import { listComplaints } from '@/services/complaintService';
import type { Complaint } from '@/types';

export default function AgentPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = useCallback(() => {
    setLoading(true);
    listComplaints()
      .then((res) => setComplaints(res))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Active complaints are those with an official reference number
  const activeTrackable = complaints.filter((c) => Boolean(c.referenceNumber));
  const otherComplaints = complaints.filter((c) => !c.referenceNumber);

  return (
    <div className="relative min-h-screen text-left">
      <CivicBackground />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-3xl px-4 pt-24 pb-16 space-y-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-eyebrow">Civic Assistant & Monitoring</div>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-white">
              Agent Activity & Tracking
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Naagrik AI understands your complaint using AI, then cross-checks the responsible authority using verified civic routing rules before preparing your complaint.
            </p>
          </div>
          <AgentStatus label="Agent Standby" />
        </div>

        {/* SECTION: ACTIVE COMPLAINTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent-300" />
              <h2 className="text-lg font-semibold text-white uppercase tracking-wider">
                ACTIVE COMPLAINTS
              </h2>
            </div>
            <span className="text-xs text-accent-300 font-mono">
              {activeTrackable.length} trackable issue{activeTrackable.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="rounded-3xl glass p-8 text-center text-xs text-gray-400 animate-pulse border border-white/5">
              Loading active civic complaints…
            </div>
          ) : activeTrackable.length === 0 ? (
            <div className="rounded-3xl glass p-8 sm:p-10 text-center border border-white/5 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/10 border border-accent-400/20 text-accent-300">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No active trackable complaints yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Once you submit a complaint to an authority and save its official reference number, your trackable complaints will appear here with live official status links and timelines.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {activeTrackable.map((complaint) => (
                <ComplaintTrackingCard
                  key={complaint.id}
                  complaint={complaint}
                  onUpdate={fetchComplaints}
                />
              ))}
            </div>
          )}
        </div>

        {/* SECTION: OTHER COMPLAINTS AWAITING REFERENCE */}
        {otherComplaints.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Complaints Awaiting Official Reference
              </h3>
              <span className="text-xs text-gray-500 font-mono">
                {otherComplaints.length} pending reference
              </span>
            </div>

            <div className="space-y-3">
              {otherComplaints.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl glass p-5 border border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-xs">
                        !
                      </span>
                      <span className="text-xs font-semibold text-white">{c.title}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {c.authority}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2">{c.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                    <span>Location: <strong className="text-white font-normal">{c.location}</strong></span>
                    <span className="text-amber-400 font-medium">Awaiting reference number</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
