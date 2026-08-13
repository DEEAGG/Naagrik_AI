import { motion } from 'framer-motion';
import { MapPin, Clock, Pencil, Trash2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Complaint } from '@/types';

interface Props {
  complaint: Complaint;
  index: number;
  isUserCreated?: boolean;
  onEdit?: (c: Complaint) => void;
  onDelete?: (c: Complaint) => void;
}

export default function ComplaintCard({ complaint, index, isUserCreated, onEdit, onDelete }: Props) {
  const hasReference = Boolean(complaint.referenceNumber);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="relative group rounded-2xl glass p-5 hover:border-accent-400/30 hover:bg-white/[0.04] transition-all text-left space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <Link to={`/complaint/${complaint.id}`} className="flex-1 flex items-start gap-3">
          <span
            className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${
              hasReference ? 'bg-accent-400 animate-breathe' : 'bg-amber-400'
            }`}
          />
          <div>
            <h3 className="text-base font-medium text-white group-hover:text-accent-200 transition-colors">
              {complaint.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
              <MapPin className="h-3 w-3 text-gray-400 flex-none" />
              <span>{complaint.location || 'Location Not Specified'}</span>
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {hasReference ? (
            <span className="text-xs font-mono font-semibold text-accent-300 bg-accent-500/10 border border-accent-400/20 px-2.5 py-1 rounded-full">
              {complaint.referenceNumber}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Awaiting official reference number
            </span>
          )}

          {isUserCreated && (
            <div className="flex items-center gap-1 ml-1">
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

      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-400">
        <span className="font-semibold text-white">{complaint.authority}</span>

        <Link
          to={`/complaint/${complaint.id}`}
          className="inline-flex items-center gap-1 text-accent-300 hover:text-accent-200 transition-colors font-medium"
        >
          <span>Track & Timeline</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
