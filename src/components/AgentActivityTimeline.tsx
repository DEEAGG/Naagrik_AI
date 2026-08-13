import { motion } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import type { AgentActivity } from '@/types';

interface Props {
  activities: AgentActivity[];
}

export default function AgentActivityTimeline({ activities }: Props) {
  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-accent-400/30 via-white/10 to-transparent" />
      <ul className="space-y-6">
        {activities.map((a, i) => (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="relative flex items-start gap-4"
          >
            <span className="relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink-900">
              {a.status === 'done' && (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success-500/15 text-success-400">
                  <Check className="h-4 w-4" />
                </span>
              )}
              {a.status === 'active' && (
                <Loader2 className="h-5 w-5 text-accent-400 animate-spin" />
              )}
              {a.status === 'pending' && <Circle className="h-5 w-5 text-gray-700" />}
            </span>
            <div className="flex-1 pt-1">
              <p className={`text-sm ${a.status === 'active' ? 'text-white' : 'text-gray-300'}`}>
                {a.action}
              </p>
              <p className="mt-0.5 text-xs text-gray-600">{a.time}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
