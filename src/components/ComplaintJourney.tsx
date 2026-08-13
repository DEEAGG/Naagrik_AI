import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ComplaintStage } from '@/types';

interface Props {
  stages: ComplaintStage[];
}

export default function ComplaintJourney({ stages }: Props) {
  return (
    <div className="relative">
      {/* horizontal on md+, vertical on mobile */}
      <div className="hidden md:flex items-start justify-between gap-2">
        {stages.map((stage, i) => (
          <div key={stage.id} className="relative flex-1 flex flex-col items-center">
            {i < stages.length - 1 && (
              <div className="absolute top-4 left-1/2 w-full h-px bg-white/10">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: stage.status === 'done' || stage.status === 'current' ? 1 : 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  style={{ originX: 0 }}
                  className="h-full bg-gradient-to-r from-accent-400 to-accent-500"
                />
              </div>
            )}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                stage.status === 'done'
                  ? 'border-success-500 bg-success-500/15 text-success-400'
                  : stage.status === 'current'
                  ? 'border-accent-400 bg-accent-500/15 text-accent-300'
                  : 'border-white/10 bg-ink-800 text-gray-600'
              }`}
            >
              {stage.status === 'done' ? (
                <Check className="h-4 w-4" />
              ) : stage.status === 'current' ? (
                <span className="h-2.5 w-2.5 rounded-full bg-accent-400 animate-breathe" />
              ) : (
                <span className="text-[10px]">{i + 1}</span>
              )}
            </motion.div>
            <span
              className={`mt-2.5 text-xs font-medium ${
                stage.status === 'current' ? 'text-white' : stage.status === 'done' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {stage.label}
            </span>
            {stage.timestamp && (
              <span className="mt-0.5 text-[10px] text-gray-600">{stage.timestamp}</span>
            )}
          </div>
        ))}
      </div>

      {/* vertical mobile */}
      <div className="md:hidden relative pl-2">
        <div className="absolute left-[18px] top-2 bottom-2 w-px bg-white/10" />
        <ul className="space-y-5">
          {stages.map((stage, i) => (
            <motion.li
              key={stage.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative flex items-center gap-3"
            >
              <div
                className={`relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 ${
                  stage.status === 'done'
                    ? 'border-success-500 bg-success-500/15 text-success-400'
                    : stage.status === 'current'
                    ? 'border-accent-400 bg-accent-500/15 text-accent-300'
                    : 'border-white/10 bg-ink-800 text-gray-600'
                }`}
              >
                {stage.status === 'done' ? (
                  <Check className="h-4 w-4" />
                ) : stage.status === 'current' ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-400 animate-breathe" />
                ) : (
                  <span className="text-[10px]">{i + 1}</span>
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    stage.status === 'current' ? 'text-white' : stage.status === 'done' ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {stage.label}
                </p>
                {stage.timestamp && <p className="text-[11px] text-gray-600">{stage.timestamp}</p>}
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
