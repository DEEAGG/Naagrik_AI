import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  mode: 'check' | 'record';
  authorityName: string;
  referenceNumber?: string;
  portalDomain?: string;
  onClose: () => void;
  onProceedToRecord: () => void;
  onSaveStatus: (status: string, note?: string) => Promise<void>;
}

const STATUS_OPTIONS = [
  'Submitted',
  'Received',
  'In Progress',
  'Under Review',
  'Resolved',
  'Rejected',
  'Closed',
  'Other',
];

export default function RecordStatusModal({
  isOpen,
  mode,
  authorityName,
  referenceNumber,
  portalDomain,
  onClose,
  onProceedToRecord,
  onSaveStatus,
}: Props) {
  const [selectedStatus, setSelectedStatus] = useState<string>('In Progress');
  const [customStatus, setCustomStatus] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = async () => {
    const finalStatus = selectedStatus === 'Other' ? customStatus.trim() : selectedStatus;
    if (!finalStatus) {
      setError('Please select or specify the status you observed on the official portal.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSaveStatus(finalStatus, note.trim() || undefined);
      onClose();
    } catch {
      setError('Failed to save status update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl glass-strong p-6 sm:p-8 text-left"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-300" />
            <h3 className="font-display text-lg font-semibold text-white uppercase tracking-wider">
              {mode === 'check' ? 'Official Status Check' : 'Record Official Status'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === 'check' ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Official Authority</span>
                <span className="font-mono text-accent-300">{portalDomain || 'gov.in'}</span>
              </div>
              <p className="text-sm font-semibold text-white">{authorityName}</p>
              {referenceNumber && (
                <div className="text-xs font-mono text-accent-300 pt-1">
                  Ref Number: <strong className="text-white">{referenceNumber}</strong>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-300 leading-relaxed">
                The official authority page has been opened in a new tab.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed bg-accent-500/10 p-3.5 rounded-xl border border-accent-400/20">
                Please check your complaint status on the official portal, then return here to save what you observed. Naagrik AI does not directly access or fabricate government status information.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="w-full sm:w-auto rounded-full border border-white/10 px-5 py-2.5 text-xs text-gray-400 hover:bg-white/5 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onProceedToRecord}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-2.5 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
              >
                <span>I checked the official portal</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider text-accent-300">
                WHAT STATUS DID YOU SEE?
              </h4>
              <p className="mt-1 text-xs text-gray-400">
                Select the status shown on the official portal for ref{' '}
                <strong className="text-white font-mono">{referenceNumber || 'complaint'}</strong>:
              </p>
            </div>

            {/* Status Radio Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = selectedStatus === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(opt);
                      if (error) setError('');
                    }}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium text-center transition-all ${
                      active
                        ? 'bg-accent-500/20 border-accent-400 text-accent-200 shadow-glow-soft'
                        : 'bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {selectedStatus === 'Other' && (
              <div>
                <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-1">
                  Specify Custom Status
                </label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="e.g. Forwarded to Executive Engineer"
                  className="w-full rounded-xl bg-ink-800 border border-white/15 px-4 py-2.5 text-xs text-white outline-none focus:border-accent-400 font-medium"
                />
              </div>
            )}

            {/* Note Textarea */}
            <div>
              <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-1">
                What did the authority portal show? (Optional note)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder='e.g. "Complaint has been forwarded to the concerned officer."'
                className="w-full resize-none rounded-xl bg-ink-800 border border-white/15 px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-accent-400 leading-relaxed font-sans"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 flex-none" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-gray-400 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-2.5 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Status Update'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
