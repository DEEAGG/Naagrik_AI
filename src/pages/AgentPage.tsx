import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import CivicBackground from '@/components/CivicBackground';
import AgentStatus from '@/components/AgentStatus';
import { listComplaints } from '@/services/complaintService';
import type { Complaint } from '@/types';

export default function AgentPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listComplaints()
      .then((res) => setComplaints(res))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen">
      <CivicBackground />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-2xl px-4 pt-24 pb-16"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-eyebrow">Agent activity</div>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-white">
              What Naagrik is doing
            </h1>
          </div>
          <AgentStatus label="Agent Standby" />
        </div>

        <p className="mt-4 text-sm text-gray-400">
          Actions, decisions and outcomes — visible to you in real time.
        </p>

        <div className="mt-8">
          {loading ? (
            <div className="rounded-3xl glass p-8 text-center text-xs text-gray-500 animate-pulse">
              Loading agent activity…
            </div>
          ) : complaints.length === 0 ? (
            <div className="rounded-3xl glass p-8 sm:p-10 text-center border border-white/5 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/10 border border-accent-400/20 text-accent-300">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No agent activity yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Your complaint activity and automated updates will appear here after you submit an issue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-3xl glass p-6 border border-white/5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500/20 text-accent-300 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-mono font-bold text-accent-300">
                        {c.id}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {c.createdAt}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">{c.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs text-gray-400 border-t border-white/5">
                    <span>Authority: <strong className="text-white">{c.authority}</strong></span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-accent-500/10 text-accent-300 border border-accent-400/20">
                      <ShieldCheck className="h-3 w-3" /> Ready for Submission
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
