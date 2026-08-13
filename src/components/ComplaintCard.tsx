import { motion } from 'framer-motion';
import { MapPin, Clock, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Complaint } from '@/types';

const STATUS = {
  pending: { dot: 'bg-pending-400', label: 'Official Portal Handoff', text: 'text-pending-400' },
  monitoring: { dot: 'bg-accent-400', label: 'Reference Linked', text: 'text-accent-300' },
  in_progress: { dot: 'bg-accent-400', label: 'Reference Linked', text: 'text-accent-300' },
  resolved: { dot: 'bg-success-400', label: 'Status Updated from Official Source', text: 'text-success-400' },
} as const;

interface Props {
  complaint: Complaint;
  index: number;
  isUserCreated?: boolean;
  onEdit?: (c: Complaint) => void;
  onDelete?: (c: Complaint) => void;
}

export default function ComplaintCard({ complaint, index, isUserCreated, onEdit, onDelete }: Props) {
  const s = STATUS[complaint.status] || STATUS.in_progress;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="relative group rounded-2xl glass p-5 hover:border-accent-400/30 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <Link to={`/complaint/${complaint.id}`} className="flex-1 flex items-start gap-3">
          <span className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${s.dot} ${complaint.status !== 'resolved' ? 'animate-breathe' : ''}`} />
          <div>
            <h3 className="text-base font-medium text-white group-hover:text-accent-200 transition-colors">
              {complaint.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3 w-3" /> {complaint.location || 'Location Not Specified'}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
          {isUserCreated && (
            <div className="flex items-center gap-1 ml-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(complaint);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Edit Complaint"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(complaint);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete Complaint"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-500">
        <span>{complaint.authority}</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> {complaint.lastUpdated}
        </span>
      </div>
    </motion.div>
  );
}
