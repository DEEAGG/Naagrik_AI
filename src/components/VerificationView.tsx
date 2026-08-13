import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ShieldCheck, ArrowRight, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import WorkflowProgress from '@/components/WorkflowProgress';
import { getAuthorityPortal } from '@/data/authorityPortals';

interface Props {
  authority?: string;
  authorityWebsite?: string;
  issueTitle?: string;
  onVerify: (referenceNumber?: string) => void;
}

export default function VerificationView({
  authority = 'Municipal Corporation of Delhi (MCD)',
  authorityWebsite = 'https://mcdonline.nic.in/pgportal/',
  issueTitle = 'Civic Complaint',
  onVerify,
}: Props) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const portalConfig = getAuthorityPortal(undefined, authority);
  const targetWebsite = authorityWebsite || portalConfig.complaintUrl;

  const handleOpenPortal = () => {
    window.open(targetWebsite, '_blank', 'noopener,noreferrer');
  };

  const handleSaveReferenceNumber = () => {
    if (!referenceNumber.trim()) {
      setError('Please enter the official complaint/reference number issued by the authority.');
      return;
    }
    setError('');
    setSavedSuccess(true);
    setTimeout(() => {
      onVerify(referenceNumber.trim());
    }, 650);
  };

  const handleSkipForNow = () => {
    onVerify();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-24 pb-16 text-left"
    >
      <div className="w-full max-w-lg">
        {/* 4-STEP WORKFLOW PROGRESS */}
        <WorkflowProgress currentStep={3} />

        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 border border-accent-400/20 shadow-glow-soft"
          >
            <FileText className="h-7 w-7 text-accent-300" />
          </motion.div>

          <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-accent-300 bg-accent-500/10 px-3.5 py-1 rounded-full border border-accent-400/20">
            Step 3 of 4 · Submission Confirmation
          </span>

          <h2 className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-white uppercase tracking-wide">
            COMPLAINT SUBMITTED?
          </h2>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed">
            Enter your official complaint/reference number.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Authority Summary Card */}
          <div className="rounded-2xl glass p-5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="uppercase tracking-wider font-semibold text-accent-300">Target Authority</span>
              <span className="text-gray-400 font-mono text-[11px]">{portalConfig.domain}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">{authority}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{issueTitle}</p>
              </div>
              <button
                onClick={handleOpenPortal}
                className="inline-flex items-center gap-2 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 border border-accent-400/30 px-3.5 py-2 text-xs font-semibold transition-all flex-none"
              >
                <span>Open Submission Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Reference Input Card */}
          <div className="rounded-3xl glass p-6 border border-accent-400/30 space-y-4">
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase text-accent-300 block">
                Enter your official complaint/reference number
              </label>
              <p className="mt-1 text-xs text-gray-400">
                Paste or type the reference ID returned on the official government website.
              </p>
            </div>

            <div>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => {
                  setReferenceNumber(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. DJB-2026-83192 or MCD-2026-18427"
                className="w-full rounded-xl bg-ink-800 border border-white/15 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-accent-400 font-mono"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 flex-none" />
                <span>{error}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-success-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4 flex-none" />
                  <span>✓ Reference number saved</span>
                </div>
                <p className="text-xs text-gray-300">
                  Keep this number safe. It was issued by the official authority.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleSaveReferenceNumber}
                className="group inline-flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-3 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
              >
                <span>Save Complaint Number</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={handleSkipForNow}
                className="w-full sm:w-auto text-xs text-gray-400 hover:text-gray-200 px-3 py-2 transition-colors text-center"
              >
                I'll enter it later
              </button>
            </div>
          </div>

          {/* Privacy Security Notice */}
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 flex items-start gap-3 text-xs text-gray-300 leading-relaxed">
            <ShieldCheck className="h-4.5 w-4.5 text-success-400 flex-none mt-0.5" />
            <div>
              <strong className="text-white block font-medium mb-0.5">Privacy Protection Guarantee</strong>
              Naagrik AI never asks for or stores your OTP, password, CAPTCHA, Aadhaar, or government login credentials.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
