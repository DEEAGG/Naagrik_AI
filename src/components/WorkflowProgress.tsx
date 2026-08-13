import { motion } from 'framer-motion';

interface Props {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { step: 1, label: 'UNDERSTAND' },
  { step: 2, label: 'REVIEW' },
  { step: 3, label: 'SUBMIT' },
  { step: 4, label: 'TRACK' },
];

export default function WorkflowProgress({ currentStep }: Props) {
  return (
    <div className="w-full max-w-xl mx-auto mb-6">
      <div className="flex items-center justify-between relative px-2">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-white/10 -z-0" />
        <div
          className="absolute top-1/2 left-6 -translate-y-1/2 h-0.5 bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-500 -z-0"
          style={{
            width: `${((currentStep - 1) / 3) * 100}%`,
          }}
        />

        {STEPS.map((item) => {
          const isActive = item.step === currentStep;
          const isDone = item.step < currentStep;

          return (
            <div key={item.step} className="relative z-10 flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isDone || isActive ? '#3B82F6' : '#1E293B',
                  borderColor: isActive ? '#60A5FA' : isDone ? '#3B82F6' : 'rgba(255,255,255,0.15)',
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono font-bold border transition-colors ${
                  isDone || isActive ? 'text-white shadow-glow-soft' : 'text-gray-500'
                }`}
              >
                {isDone ? '✓' : item.step}
              </motion.div>
              <span
                className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${
                  isActive ? 'text-accent-300 font-bold' : isDone ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
