import { motion } from 'framer-motion';
import AIInput from './AIInput';
import SuggestionChip from './SuggestionChip';
import { SUGGESTIONS } from '@/data/mockData';
import type { LocationData } from '@/types';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onLocationDataSelected?: (loc: LocationData) => void;
  onEvidenceChange?: (files: File[]) => void;
  currentLocationData?: LocationData;
}

export default function Hero({
  value,
  onChange,
  onSubmit,
  onLocationDataSelected,
  onEvidenceChange,
  currentLocationData,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.4 } }}
      transition={{ duration: 0.6 }}
      className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 pt-24 pb-12 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-eyebrow"
      >
        Your Civic Action Agent
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5 }}
        className="mt-5 font-display text-3xl sm:text-4xl md:text-[42px] font-semibold tracking-tight text-white text-balance leading-[1.15]"
      >
        What's wrong in your area?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.5 }}
        className="mt-4 max-w-xl text-[15px] sm:text-base text-gray-400 leading-relaxed text-balance"
      >
        Tell Naagrik what happened. Your AI agent will figure out what to do next.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34, duration: 0.5 }}
        className="mt-9 w-full"
      >
        <AIInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onLocationDataSelected={onLocationDataSelected}
          onEvidenceChange={onEvidenceChange}
          currentLocationData={currentLocationData}
        />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-gray-600 mr-1">Try saying</span>
          {SUGGESTIONS.map((s) => (
            <SuggestionChip key={s} text={s} onClick={() => onChange(s)} />
          ))}
        </div>

        <p className="mt-5 text-xs text-gray-600">
          No forms. No searching. Just tell us what happened.
        </p>
      </motion.div>
    </motion.section>
  );
}
