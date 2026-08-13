import { motion } from 'framer-motion';

export default function AgentStatus({ label = 'Agent working' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.03] border border-white/10 px-3.5 py-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-accent-400"
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-400" />
      </span>
      <span className="text-xs font-medium text-gray-200">{label}</span>
    </div>
  );
}
