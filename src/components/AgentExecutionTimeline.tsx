import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import AgentStatus from './AgentStatus';
import type { ExecutionStep } from '@/types';
import { EXECUTION_STEPS } from '@/data/mockData';

interface Props {
  onComplete: () => void;
}

export default function AgentExecutionTimeline({ onComplete }: Props) {
  const [steps, setSteps] = useState<ExecutionStep[]>(
    EXECUTION_STEPS.map((s) => ({ ...s, status: s.id === 'e1' ? 'active' : s.status === 'done' ? 'done' : 'pending' as const })),
  );

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    EXECUTION_STEPS.forEach((_, i) => {
      const t = window.setTimeout(() => {
        if (cancelled) return;
        setSteps((prev) => {
          const next = prev.map((s) => ({ ...s }));
          if (next[i]) {
            next[i].status = 'done';
            if (next[i + 1]) next[i + 1].status = 'active';
          }
          return next;
        });
      }, 700 + i * 950);
      timers.push(t);
    });

    const final = window.setTimeout(() => {
      if (!cancelled) onComplete();
    }, 700 + EXECUTION_STEPS.length * 950 + 400);
    timers.push(final);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 mx-auto w-full max-w-xl px-4 pt-28 pb-16"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-eyebrow">Agent execution</div>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-white">
            Naagrik is taking care of it.
          </h2>
        </div>
        <AgentStatus label="Agent working" />
      </div>

      <div className="mt-10 relative">
        {/* vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-accent-400/40 via-white/10 to-transparent" />

        <ul className="space-y-5">
          {steps.map((step, i) => (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="relative flex items-center gap-4"
            >
              <span className="relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink-900">
                {step.status === 'done' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-success-500/15 text-success-400"
                  >
                    <Check className="h-4 w-4" />
                  </motion.span>
                )}
                {step.status === 'active' && (
                  <Loader2 className="h-5 w-5 text-accent-400 animate-spin" />
                )}
                {step.status === 'pending' && (
                  <Circle className="h-5 w-5 text-gray-700" />
                )}
              </span>
              <span
                className={`text-sm transition-colors ${
                  step.status === 'pending'
                    ? 'text-gray-600'
                    : step.status === 'active'
                    ? 'text-white'
                    : 'text-gray-300'
                }`}
              >
                {step.label}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
