import { motion } from 'framer-motion';
import { Check, Eye, Plus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkflowProgress from '@/components/WorkflowProgress';

interface Props {
  complaintId: string;
  onReportAnother: () => void;
}

export default function SuccessView({ complaintId, onReportAnother }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-24 pb-16"
    >
      <div className="w-full max-w-md text-center">
        <WorkflowProgress currentStep={4} />
        {/* Animated Success Ring */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          className="relative mx-auto flex h-24 w-24 items-center justify-center"
        >
          <motion.span
            className="absolute inset-0 rounded-full border border-success-500/30"
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="absolute inset-2 rounded-full border border-success-500/20"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-success-500/25 to-success-600/10 border border-success-400/30">
            <Check className="h-8 w-8 text-success-400" strokeWidth={2.5} />
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-7 font-display text-2xl sm:text-3xl font-semibold text-white"
        >
          Reference number saved.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2"
        >
          <span className="font-mono text-sm tracking-wider text-white">{complaintId}</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-success-400">
            <span className="h-2 w-2 rounded-full bg-success-400" />
            Official Reference Saved
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-5 text-sm text-gray-300 leading-relaxed"
        >
          Keep this number safe. It is issued by the official authority. You can return to Naagrik AI anytime to launch the official tracking page.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={() => navigate(`/complaint/${complaintId}`)}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-3 text-sm font-medium text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
          >
            <Eye className="h-4 w-4" />
            Track Complaint
          </button>
          <button
            onClick={onReportAnother}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Report another issue
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 text-center"
        >
          <ShieldCheck className="h-4 w-4 text-success-400 flex-none" />
          <span>Status is checked directly through the official authority portal.</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
