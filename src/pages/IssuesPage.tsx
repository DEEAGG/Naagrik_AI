import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, Check, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import CivicBackground from '@/components/CivicBackground';
import ComplaintCard from '@/components/ComplaintCard';
import { listComplaints, isUserCreatedComplaint, updateComplaint, deleteComplaint } from '@/services/complaintService';
import { recordReferenceSaved } from '@/services/trackingService';
import type { Complaint } from '@/types';

export default function IssuesPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [deletingComplaint, setDeletingComplaint] = useState<Complaint | null>(null);

  // Edit Form Fields State
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editReferenceNumber, setEditReferenceNumber] = useState('');

  const loadComplaints = useCallback(() => {
    listComplaints().then((c) => setComplaints(c));
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleOpenEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setEditTitle(complaint.title);
    setEditDescription(complaint.description);
    setEditCategory(complaint.category);
    setEditLocation(complaint.location);
    setEditReferenceNumber(complaint.referenceNumber || '');
  };

  const handleSaveEdit = async () => {
    if (!editingComplaint) return;

    await updateComplaint(editingComplaint.id, {
      title: editTitle,
      description: editDescription,
      category: editCategory,
      location: editLocation,
      referenceNumber: editReferenceNumber.trim() || undefined,
    });

    if (editReferenceNumber.trim() && editReferenceNumber.trim() !== editingComplaint.referenceNumber) {
      await recordReferenceSaved(editingComplaint.id, editReferenceNumber.trim());
    }

    setEditingComplaint(null);
    loadComplaints();
  };

  const handleConfirmDelete = async () => {
    if (!deletingComplaint) return;
    await deleteComplaint(deletingComplaint.id);
    setDeletingComplaint(null);
    loadComplaints();
  };

  return (
    <div className="relative min-h-screen text-left">
      <CivicBackground />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-2xl px-4 pt-24 pb-16"
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="text-eyebrow">Your issues</div>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-white">
              Your issues
            </h1>
          </div>
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2.5 text-sm font-medium text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
          >
            <Plus className="h-4 w-4" /> Report new
          </Link>
        </div>

        <div className="mt-8 space-y-3">
          {complaints.length > 0 ? (
            complaints.map((c, i) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                index={i}
                isUserCreated={isUserCreatedComplaint(c.id)}
                onEdit={handleOpenEdit}
                onDelete={(comp) => setDeletingComplaint(comp)}
              />
            ))
          ) : (
            <div className="rounded-3xl glass p-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/10 border border-accent-400/20 text-accent-300">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">No complaints yet</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Your submitted civic complaints will appear here for tracking and updates.
              </p>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
                >
                  Report Your First Issue →
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editingComplaint && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm"
              onClick={() => setEditingComplaint(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl glass-strong p-6 sm:p-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-accent-300">
                  <Pencil className="h-5 w-5" />
                  <span className="text-xs font-semibold tracking-wider uppercase">Edit Complaint</span>
                </div>
                <button
                  onClick={() => setEditingComplaint(null)}
                  className="text-gray-500 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">Issue Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-400/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full resize-none rounded-xl bg-ink-800 border border-white/10 px-4 py-2.5 text-sm text-white leading-relaxed outline-none focus:border-accent-400/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold tracking-wider uppercase text-accent-300">Official Reference Number</label>
                  <input
                    type="text"
                    value={editReferenceNumber}
                    onChange={(e) => setEditReferenceNumber(e.target.value)}
                    placeholder="e.g. DJB-2026-83192"
                    className="mt-1 w-full rounded-xl bg-ink-800 border border-white/15 px-4 py-2.5 text-sm text-accent-300 font-mono outline-none focus:border-accent-400/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">Category</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-400/40"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">Location</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-accent-400/40"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingComplaint(null)}
                  className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-2.5 text-sm font-medium text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
                >
                  <Check className="h-4 w-4" /> Save changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingComplaint && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm"
              onClick={() => setDeletingComplaint(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl glass-strong p-6 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Trash2 className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">
                Delete Complaint?
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">"{deletingComplaint.title}"</strong>? This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setDeletingComplaint(null)}
                  className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-colors shadow-glow-soft"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
