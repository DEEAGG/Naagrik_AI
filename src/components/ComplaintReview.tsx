import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon,
  Pencil,
  Check,
  ShieldCheck,
  MapPin,
  FileText,
  Copy,
  ExternalLink,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import LocationSelectorModal from '@/components/LocationSelectorModal';
import WorkflowProgress from '@/components/WorkflowProgress';
import { generateOfficialComplaintLetter } from '@/services/aiService';
import { getAuthorityPortal } from '@/data/authorityPortals';
import type { AnalysisResult, LocationData, MultiIssueQueueState } from '@/types';

interface Props {
  analysis: AnalysisResult;
  evidenceCount: number;
  onApprove: () => void;
  onUpdateAnalysis?: (updated: Partial<AnalysisResult>) => void;
  multiIssueQueue?: MultiIssueQueueState | null;
}

export default function ComplaintReview({
  analysis,
  evidenceCount,
  onApprove,
  onUpdateAnalysis,
  multiIssueQueue,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // Collapsed by default

  const submitSectionRef = useRef<HTMLDivElement>(null);

  const [issue, setIssue] = useState(analysis.issueTitle || analysis.issue || 'Civic Issue');
  const [category, setCategory] = useState(analysis.category || 'Sanitation');
  const [authority, setAuthority] = useState(analysis.authority || 'Local Authority');
  const [locationData, setLocationData] = useState<LocationData>(
    analysis.locationData || {
      address: analysis.location || 'Location Not Specified',
      source: 'unspecified',
    }
  );
  const [description, setDescription] = useState(
    analysis.description || `Civic issue reported: "${analysis.issue}". Immediate municipal inspection requested.`
  );

  const [complaintLetter, setComplaintLetter] = useState(
    analysis.complaintLetter ||
      generateOfficialComplaintLetter({
        authority: analysis.authority || 'Local Authority',
        issueTitle: analysis.issueTitle || analysis.issue || 'Civic Issue',
        location: analysis.locationData?.address || analysis.location || 'Location Not Specified',
        description: analysis.description || `Civic issue reported: "${analysis.issue}". Immediate municipal inspection requested.`,
      })
  );

  const [editBuffer, setEditBuffer] = useState(complaintLetter);

  const portalConfig = getAuthorityPortal(undefined, authority);
  const targetComplaintUrl = analysis.authorityWebsite || portalConfig.complaintUrl;

  const isLocationValid =
    locationData &&
    locationData.source !== 'unspecified' &&
    locationData.address &&
    locationData.address !== 'Location Not Specified' &&
    locationData.address !== 'Not specified (Optional)';

  useEffect(() => {
    if (analysis.issueTitle || analysis.issue) setIssue(analysis.issueTitle || analysis.issue);
    if (analysis.category) setCategory(analysis.category);
    if (analysis.authority) setAuthority(analysis.authority);
    if (analysis.description) setDescription(analysis.description);
    if (analysis.locationData) setLocationData(analysis.locationData);
    if (analysis.complaintLetter) {
      setComplaintLetter(analysis.complaintLetter);
      setEditBuffer(analysis.complaintLetter);
    }
  }, [analysis]);

  const handleStartEdit = () => {
    setEditBuffer(complaintLetter);
    setEditing(true);
  };

  const handleSaveEdit = () => {
    setEditing(false);
    setComplaintLetter(editBuffer);
    if (onUpdateAnalysis) {
      onUpdateAnalysis({
        issueTitle: issue,
        issue,
        category,
        authority,
        location: locationData.address,
        locationData,
        description,
        complaintLetter: editBuffer,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditBuffer(complaintLetter);
  };

  const handleCopyAndContinue = async () => {
    try {
      await navigator.clipboard.writeText(complaintLetter);
      setCopied(true);
      setCopyError('');
      setTimeout(() => setCopied(false), 5000);
    } catch {
      setCopyError('Could not auto-copy to clipboard. Please copy the text manually.');
    }

    if (submitSectionRef.current) {
      submitSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenOfficialPortal = () => {
    window.open(targetComplaintUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmApprove = () => {
    if (!isLocationValid) {
      setIsLocationModalOpen(true);
      return;
    }

    if (onUpdateAnalysis) {
      onUpdateAnalysis({
        issueTitle: issue,
        issue,
        category,
        authority,
        location: locationData.address,
        locationData,
        description,
        complaintLetter,
      });
    }
    onApprove();
  };

  const handleSelectNewLocation = (newLoc: LocationData) => {
    setLocationData(newLoc);
    const updatedLetter = generateOfficialComplaintLetter({
      authority,
      issueTitle: issue,
      location: newLoc.address,
      description,
    });
    setComplaintLetter(updatedLetter);
    setEditBuffer(updatedLetter);
    if (onUpdateAnalysis) {
      onUpdateAnalysis({
        location: newLoc.address,
        locationData: newLoc,
        complaintLetter: updatedLetter,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 mx-auto w-full max-w-xl px-4 pt-24 pb-16 text-left"
    >
      {/* 4-STEP WORKFLOW PROGRESS */}
      <WorkflowProgress currentStep={2} />

      {multiIssueQueue && multiIssueQueue.mode === 'separate' && (
        <div className="mb-6 rounded-2xl bg-accent-500/10 border border-accent-400/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 font-bold text-white text-xs shadow-glow-soft">
              {multiIssueQueue.currentIndex + 1}
            </span>
            <div>
              <div className="text-xs text-accent-300 font-medium uppercase tracking-wider">
                Multi-Issue Queue ({multiIssueQueue.currentIndex + 1} of {multiIssueQueue.drafts.length})
              </div>
              <div className="text-sm font-semibold text-white">
                {analysis.issueTitle || analysis.issue}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={locationData}
        onSelectLocation={handleSelectNewLocation}
      />

      <div className="text-eyebrow">Citizen Review</div>
      <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-white tracking-wide">
        REVIEW YOUR COMPLAINT
      </h2>
      <p className="mt-2 text-xs text-gray-300 italic">
        "Naagrik AI prepares and guides. The citizen remains in control of the final government submission."
      </p>

      {/* SECTION 1: METADATA & LOCATION SUMMARY */}
      <div className="mt-8 rounded-2xl glass p-5 space-y-4 border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-accent-300 block mb-0.5">
              Issue
            </span>
            <h3 className="text-base font-semibold text-white">{issue}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-0.5">
              Category
            </span>
            <span className="text-sm font-semibold text-white">{category}</span>
          </div>

          <div className="rounded-xl bg-white/[0.03] p-3 border border-white/5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-0.5">
              Responsible Authority
            </span>
            <span className="text-sm font-semibold text-accent-300">{authority}</span>
            {analysis.isVerifiedRouting && (
              <span className="mt-1 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Verified Civic Routing
              </span>
            )}
          </div>
        </div>

        {/* CONFIRMED LOCATION BOX */}
        <div
          className={`rounded-xl p-3.5 border transition-all ${
            isLocationValid
              ? 'bg-accent-500/10 border-accent-400/20'
              : 'bg-amber-500/10 border-amber-400/30'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-accent-300 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-accent-400" />
              CONFIRMED LOCATION
            </span>
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-accent-300 hover:underline font-medium"
            >
              <Pencil className="h-3 w-3" /> {isLocationValid ? 'Change Location' : 'Add Location'}
            </button>
          </div>
          {isLocationValid ? (
            <p className="text-sm font-medium text-white">{locationData.address}</p>
          ) : (
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-amber-300 font-medium">No confirmed location provided yet.</p>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="rounded-lg bg-amber-500 text-ink-950 px-3 py-1 text-xs font-bold hover:bg-amber-400"
              >
                Add Location
              </button>
            </div>
          )}
        </div>

        {evidenceCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-300 pt-1">
            <ImageIcon className="h-4 w-4 text-accent-300" />
            <span>{evidenceCount} evidence photo(s) attached</span>
          </div>
        )}
      </div>

      {/* SECTION 2: FINAL COMPLAINT EDITOR */}
      <div className="mt-6 rounded-2xl border border-accent-400/30 bg-ink-900/90 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-accent-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-accent-300">
              FINAL COMPLAINT
            </span>
          </div>
          {!editing ? (
            <button
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 px-3 py-1.5 text-xs font-semibold border border-accent-400/30 transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Complaint
            </button>
          ) : (
            <span className="text-[10px] text-amber-300 font-mono font-bold uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded border border-amber-400/30">
              Editing Mode
            </span>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editBuffer}
              onChange={(e) => setEditBuffer(e.target.value)}
              rows={10}
              className="w-full resize-none rounded-xl bg-ink-950 border border-accent-400/40 p-4 font-mono text-xs text-white leading-relaxed outline-none focus:border-accent-400"
              placeholder="Edit your complaint text..."
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400 italic">
                Modifications will become your final complaint text.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="rounded-lg border border-white/10 px-3.5 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500 text-white px-4 py-1.5 text-xs font-semibold hover:bg-accent-600 shadow-glow-soft transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs text-gray-200 leading-relaxed bg-ink-950/70 p-4 rounded-xl border border-white/5 selection:bg-accent-500/30">
            {complaintLetter}
          </pre>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-gray-400 italic">
            The AI-generated complaint is only a draft. The citizen always has final control.
          </p>

          <button
            onClick={handleCopyAndContinue}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
          >
            <Copy className="h-4 w-4" />
            {copied ? '✓ Complaint Copied to Clipboard' : 'Copy Complaint & Continue'}
          </button>
        </div>

        {copied && (
          <p className="text-xs text-success-400 font-semibold pt-1">
            ✓ Complaint copied to clipboard. Proceed to open the official portal below.
          </p>
        )}
        {copyError && <p className="text-xs text-rose-400 font-medium pt-1">{copyError}</p>}
      </div>

      {/* SECTION 3: OFFICIAL SUBMISSION HANDOFF */}
      <div ref={submitSectionRef} className="mt-8 rounded-3xl glass border border-accent-400/30 p-6 space-y-6">
        <div>
          <span className="text-eyebrow">Official Submission Handoff</span>
          <h3 className="mt-1 text-xl font-semibold text-white">Submit Your Complaint</h3>
          <p className="mt-1.5 text-xs text-gray-300 leading-relaxed">
            Naagrik AI has prepared your complaint. You only need to copy it, open the official submission channel, paste your complaint, and complete the final submission yourself.
          </p>
        </div>

        {/* 4 VISUAL WORKFLOW STEPS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-accent-300 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-400/20">
                STEP 1
              </span>
              {copied && <span className="text-[10px] text-success-400 font-semibold">✓ Copied</span>}
            </div>
            <h4 className="text-xs font-bold text-white">Copy Complaint</h4>
            <p className="text-[11px] text-gray-400">Final complaint copied to clipboard.</p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-accent-300 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-400/20">
                STEP 2
              </span>
              <span className="text-[10px] font-mono text-accent-300 truncate max-w-[110px]">{portalConfig.domain}</span>
            </div>
            <h4 className="text-xs font-bold text-white">Open Official Page</h4>
            <button
              onClick={handleOpenOfficialPortal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300 hover:underline mt-0.5"
            >
              <span>Open {portalConfig.authority} Page</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-accent-300 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-400/20">
              STEP 3
            </span>
            <h4 className="text-xs font-bold text-white">Paste & Submit</h4>
            <p className="text-[11px] text-gray-400">
              Paste the copied complaint into the official form, complete any required details, verify the information, and submit it.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-accent-300 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-400/20">
              STEP 4
            </span>
            <h4 className="text-xs font-bold text-white">Save Reference Number</h4>
            <p className="text-[11px] text-gray-400">Enter official reference number here.</p>
          </div>
        </div>

        {/* PRIMARY PORTAL LAUNCH ACTION */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleOpenOfficialPortal}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-3 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
          >
            <span>Open Official Complaint Page ↗</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {/* COLLAPSIBLE DETAILED INSTRUCTIONS (Collapsed by default per Requirement 5) */}
        <div className="rounded-2xl border border-white/10 bg-ink-950/60 overflow-hidden">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-accent-300" />
              <span className="text-xs font-semibold text-gray-300">
                Need help submitting on this portal?
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-accent-300 font-medium">
              <span>{showInstructions ? 'Hide instructions' : 'Show step-by-step instructions'}</span>
              {showInstructions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-4 space-y-3 border-t border-white/5"
              >
                {portalConfig.descriptionNote && (
                  <p className="mt-3 text-xs text-accent-300 bg-accent-500/10 p-3 rounded-xl border border-accent-400/20">
                    {portalConfig.descriptionNote}
                  </p>
                )}

                <ol className="mt-3 space-y-2 text-xs text-gray-300">
                  {portalConfig.instructions.map((stepText, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-accent-300 flex-none">{idx + 1}.</span>
                      <span>{stepText}</span>
                    </li>
                  ))}
                </ol>

                {portalConfig.fallbackContact && (
                  <p className="text-[11px] text-gray-400 font-mono pt-1">
                    Contact: {portalConfig.fallbackContact}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CONTINUATION TO REFERENCE NUMBER ENTRY */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={handleConfirmApprove}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-3 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
          >
            <span>I Have Submitted — Save Reference Number</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* SECURITY NOTICE */}
      <div className="mt-6 flex items-start justify-center gap-2.5 rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-xs text-gray-300 text-center leading-relaxed">
        <ShieldCheck className="h-4.5 w-4.5 text-success-400 flex-none mt-0.5" />
        <span>
          Naagrik AI never asks for or stores your OTP, password, CAPTCHA, Aadhaar, or government login credentials.
        </span>
      </div>
    </motion.div>
  );
}
