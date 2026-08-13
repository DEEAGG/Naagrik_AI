import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, Clock, Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listComplaints } from '@/services/complaintService';
import type { Complaint } from '@/types';

export default function RecentActivitySection() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listComplaints()
      .then((res) => {
        setComplaints(res);
      })
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative z-10 mx-auto w-full max-w-4xl px-4 pt-4 pb-20 text-left">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-eyebrow">
            <Activity className="h-3.5 w-3.5 text-accent-300 animate-pulse" />
            <span>Agent Activity Feed</span>
          </div>
          <h2 className="mt-2 font-display text-xl sm:text-2xl font-semibold text-white">
            Recent System Activity
          </h2>
        </div>
        {complaints.length > 0 && (
          <Link
            to="/issues"
            className="text-xs text-accent-300 hover:text-accent-200 font-medium inline-flex items-center gap-1 transition-colors"
          >
            View all ({complaints.length}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl glass p-8 text-center text-xs text-gray-500 animate-pulse">
          Loading activity feed…
        </div>
      ) : complaints.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl glass p-8 sm:p-10 text-center border border-white/5"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/10 border border-accent-400/20 text-accent-300">
            <Bot className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No recent activity</h3>
          <p className="mt-2 text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Your complaint activity will appear here after you submit an issue.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {complaints.slice(0, 5).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="rounded-2xl glass p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent-500/15 border border-accent-400/20 text-accent-300">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Complaint Registered & Prepared
                    </span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white/5 text-accent-300 border border-white/10">
                      {c.id}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-300 font-medium">
                    {c.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400 flex items-center gap-2">
                    <span>{c.authority}</span>
                    <span>·</span>
                    <span className="truncate max-w-[200px]">{c.location}</span>
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent-500/10 text-accent-300 border border-accent-400/20">
                  <ShieldCheck className="h-3 w-3" />
                  Ready for Authority Submission
                </span>
                <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {c.createdAt}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
