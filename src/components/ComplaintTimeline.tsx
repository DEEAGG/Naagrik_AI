import { motion } from 'framer-motion';
import { FileText, Bookmark, ExternalLink, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import type { ComplaintTrackingEvent, TrackingEventType } from '@/types';

interface Props {
  events: ComplaintTrackingEvent[];
  loading?: boolean;
}

function getEventConfig(type: TrackingEventType) {
  switch (type) {
    case 'complaint_created':
      return {
        title: 'Complaint created',
        icon: FileText,
        badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-400/20',
        dotColor: 'bg-blue-400',
      };
    case 'reference_saved':
      return {
        title: 'Official reference number saved',
        icon: Bookmark,
        badgeColor: 'bg-accent-500/10 text-accent-300 border-accent-400/20',
        dotColor: 'bg-accent-400',
      };
    case 'status_checked':
      return {
        title: 'Status checked on official portal',
        icon: ExternalLink,
        badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-400/20',
        dotColor: 'bg-indigo-400',
      };
    case 'status_updated':
      return {
        title: 'Status updated by citizen',
        icon: RefreshCw,
        badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
        dotColor: 'bg-emerald-400',
      };
    default:
      return {
        title: 'Event recorded',
        icon: CheckCircle2,
        badgeColor: 'bg-gray-500/10 text-gray-300 border-gray-400/20',
        dotColor: 'bg-gray-400',
      };
  }
}

function formatTimestamp(isoOrText?: string): string {
  if (!isoOrText) return 'Just now';
  try {
    const d = new Date(isoOrText);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ' • ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch {
    // Fallback
  }
  return isoOrText;
}

export default function ComplaintTimeline({ events, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white/[0.02] p-6 text-center text-xs text-gray-400 animate-pulse border border-white/5">
        Loading complaint timeline events…
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.02] p-6 text-center text-xs text-gray-400 border border-white/5">
        No tracking events recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
      {events.map((evt, idx) => {
        const cfg = getEventConfig(evt.eventType);
        const IconComponent = cfg.icon;
        const formattedDate = formatTimestamp(evt.createdAt);

        return (
          <motion.div
            key={evt.id || idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className="relative"
          >
            {/* Timeline node icon */}
            <div
              className={`absolute -left-[27px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-ink-900 text-white shadow-sm`}
            >
              <IconComponent className="h-3 w-3 text-accent-300" />
            </div>

            <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5 space-y-2 hover:bg-white/[0.05] transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white tracking-wide">
                  {cfg.title}
                </span>

                {evt.status && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badgeColor}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`} />
                    {evt.status}
                  </span>
                )}
              </div>

              {evt.note && (
                <p className="text-xs text-gray-300 leading-relaxed italic bg-black/20 p-2.5 rounded-xl border border-white/5 font-mono">
                  "{evt.note}"
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-0.5">
                <Clock className="h-3 w-3 text-gray-400" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
