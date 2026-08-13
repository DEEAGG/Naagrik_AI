import { motion } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import type { ProcessingStep } from '@/types';

interface Props {
  steps: ProcessingStep[];
}

export default function ProcessingSequence({ steps }: Props) {
  return (
    <ul className="space-y-3">
      {steps.map((step) => (
        <motion.li
          key={step.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <span className="flex h-6 w-6 items-center justify-center">
            {step.status === 'done' && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-500/15 text-success-400">
                <Check className="h-3.5 w-3.5" />
              </span>
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
  );
}
