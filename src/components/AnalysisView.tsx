import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, Sparkles, HelpCircle, Layers, Send, Navigation, Bookmark, Loader2, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';
import LocationSelectorModal from '@/components/LocationSelectorModal';
import WorkflowProgress from '@/components/WorkflowProgress';
import { getCurrentGPSLocation, formatCoordinates } from '@/services/locationService';
import type { AnalysisResult, AgentPlanStep, LocationData } from '@/types';

interface Props {
  analysis: AnalysisResult;
  locationData: LocationData;
  plan: AgentPlanStep[];
  onReview: () => void;
  onLocationDataSelected: (locData: LocationData) => void;
  onAnswerClarification?: (answer: string) => void;
  onSelectOption?: (option: string) => void;
  onSelectMultiIssueMode?: (mode: 'split' | 'combine') => void;
}

export default function AnalysisView({
  analysis,
  locationData,
  plan,
  onReview,
  onLocationDataSelected,
  onAnswerClarification,
  onSelectOption,
  onSelectMultiIssueMode,
}: Props) {
  const [customAnswer, setCustomAnswer] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'search' | 'gps' | 'saved'>('search');
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const isLocationProvided =
    locationData &&
    locationData.source !== 'unspecified' &&
    locationData.address &&
    locationData.address !== 'Location Not Specified' &&
    locationData.address !== 'Not specified (Optional)';

  const handleFetchGPSInline = async () => {
    setLoadingGps(true);
    setGpsError(null);
    try {
      const loc = await getCurrentGPSLocation();
      setLoadingGps(false);
      onLocationDataSelected(loc);
    } catch (err: any) {
      setLoadingGps(false);
      setGpsError(err.message || 'Unable to access your current location. You can enter the location manually instead.');
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAnswer.trim()) return;
    if (onAnswerClarification) {
      onAnswerClarification(customAnswer.trim());
      setCustomAnswer('');
    }
  };

  const handleOpenModal = (tab: 'search' | 'gps' | 'saved') => {
    setModalInitialTab(tab);
    setIsLocationModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 mx-auto w-full max-w-2xl px-4 pt-28 pb-16"
    >
      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialTab={modalInitialTab}
        currentLocation={locationData}
        onSelectLocation={(loc) => {
          onLocationDataSelected(loc);
          setIsLocationModalOpen(false);
        }}
      />

      <WorkflowProgress currentStep={1} />

      <div className="text-eyebrow">Analysis complete</div>
      <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-white">
        {analysis.multiIssueDetected
          ? 'Multiple issues detected'
          : analysis.needsClarification
          ? "Let's understand this better."
          : 'I can prepare this complaint now.'}
      </h2>

      {/* MULTI ISSUE VIEW */}
      {analysis.multiIssueDetected && analysis.detectedIssues && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4 text-left"
        >
          <p className="text-sm text-gray-300">
            {analysis.clarificationQuestion || 'I detected multiple distinct civic issues in your message:'}
          </p>

          <div className="space-y-3">
            {analysis.detectedIssues.map((draft, idx) => (
              <div key={draft.id || idx} className="rounded-2xl glass p-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-accent-300 uppercase tracking-wider">
                    Issue {idx + 1} · {draft.category}
                  </span>
                  <span className="text-xs text-gray-400">{draft.authority}</span>
                </div>
                <h4 className="mt-1 text-base font-medium text-white">{draft.title}</h4>
                <p className="mt-1 text-xs text-gray-400 italic">"{draft.description}"</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              onClick={() => onSelectMultiIssueMode && onSelectMultiIssueMode('split')}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-sm font-medium text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
            >
              <Layers className="h-4 w-4" /> Create {analysis.detectedIssues.length} separate complaints
            </button>
            <button
              onClick={() => onSelectMultiIssueMode && onSelectMultiIssueMode('combine')}
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors"
            >
              Combine into single report
            </button>
          </div>
        </motion.div>
      )}

      {/* REQUIRED CLARIFICATION VIEW */}
      {!analysis.multiIssueDetected && analysis.needsClarification && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-8 rounded-2xl glass p-6 text-left border border-amber-400/30 bg-amber-500/5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Authority needs confirmation
              </span>
              <p className="text-sm text-gray-200 leading-relaxed pt-1 font-medium">
                {analysis.clarificationQuestion ||
                  'Road responsibility can depend on who maintains the road. Please confirm the responsible authority before continuing.'}
              </p>
            </div>
          </div>

          {/* Multiple choice clarification options */}
          {analysis.suggestedOptions && analysis.suggestedOptions.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {analysis.suggestedOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onSelectOption && onSelectOption(opt)}
                  className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-100 hover:border-amber-400 hover:bg-amber-500/20 transition-all text-left"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Free-text clarification input */}
          <form onSubmit={handleCustomSubmit} className="mt-5 flex gap-2">
            <input
              type="text"
              value={customAnswer}
              onChange={(e) => setCustomAnswer(e.target.value)}
              placeholder="Or type your response here in your own words…"
              className="flex-1 rounded-xl bg-ink-800 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-400/40"
            />
            <button
              type="submit"
              disabled={!customAnswer.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white disabled:opacity-40"
              aria-label="Submit clarification"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </motion.div>
      )}

      {/* SUFFICIENT ANALYSIS VIEW */}
      {!analysis.multiIssueDetected && !analysis.needsClarification && (
        <>
          {/* Analysis Summary Grid */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Field icon={<Sparkles className="h-4 w-4" />} label="Issue" value={analysis.issueTitle || analysis.issue} delay={0.05} />
            <Field icon={<MapPin className="h-4 w-4" />} label="Category" value={analysis.category} delay={0.12} />
            <Field icon={<ShieldCheck className="h-4 w-4" />} label="Likely Authority" value={analysis.authority || 'Local Authority'} delay={0.19} />
            <Field
              icon={<MapPin className="h-4 w-4" />}
              label="Location Status"
              value={isLocationProvided ? locationData.address : 'Location Required'}
              delay={0.26}
            />
          </div>

          {/* VERIFIED ROUTING EXPLANATION BANNER */}
          {analysis.isVerifiedRouting && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 rounded-xl bg-accent-500/10 border border-accent-400/20 p-3.5 flex items-start gap-3 text-left"
            >
              <ShieldCheck className="h-4 w-4 text-accent-300 flex-none mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-accent-300">
                  Authority identified using verified civic routing
                </div>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                  Naagrik AI understands your complaint with AI, then cross-checks the responsible authority against verified civic routing rules.
                </p>
              </div>
            </motion.div>
          )}

          {/* DEDICATED LOCATION SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`mt-6 rounded-2xl p-5 text-left border transition-all ${
              isLocationProvided
                ? 'border-accent-400/30 bg-accent-500/10'
                : 'border-pending-500/40 bg-pending-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className={`h-4 w-4 ${isLocationProvided ? 'text-accent-300' : 'text-pending-400'}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  {isLocationProvided ? 'CONFIRMED LOCATION' : 'CONFIRMED LOCATION — Required'}
                </span>
              </div>
              {isLocationProvided && (
                <span className="rounded-full bg-accent-500/20 border border-accent-400/30 px-2.5 py-0.5 text-[10px] font-semibold text-accent-300 uppercase tracking-wider">
                  {locationData.source}
                </span>
              )}
            </div>

            {!isLocationProvided ? (
              <div className="mt-3">
                <p className="text-xs text-gray-300">
                  Please add the location where this issue is occurring before continuing to complaint review.
                </p>

                {gpsError && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 flex-none" />
                    <span>{gpsError}</span>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleFetchGPSInline}
                    disabled={loadingGps}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-2 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {loadingGps ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        Getting your precise location…
                      </>
                    ) : (
                      <>
                        <Navigation className="h-3.5 w-3.5 text-white" />
                        Use Current Location
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenModal('search')}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 hover:border-accent-400/40 hover:bg-white/10 transition-colors"
                  >
                    Enter Manually
                  </button>

                  <button
                    onClick={() => handleOpenModal('saved')}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 hover:border-accent-400/40 hover:bg-white/10 transition-colors"
                  >
                    Choose Saved Location
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-400 flex-none mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">{locationData.address}</p>
                      {locationData.landmark && (
                        <p className="text-xs text-gray-400 mt-0.5">Landmark: {locationData.landmark}</p>
                      )}
                      {locationData.latitude !== undefined && locationData.longitude !== undefined && (
                        <p className="mt-1 text-[11px] font-mono text-accent-300">
                          GPS: {formatCoordinates(locationData.latitude, locationData.longitude)}
                          {locationData.accuracy && ` (±${locationData.accuracy}m)`}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenModal('search')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent-300 hover:underline flex-none"
                  >
                    <Pencil className="h-3 w-3" /> Change Location
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Agent Plan */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.45 }}
            className="mt-8 text-left"
          >
            <p className="text-sm font-medium text-gray-200">Here's what I'm going to do:</p>
            <ol className="mt-4 space-y-3">
              {plan.map((step, i) => (
                <motion.li
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.35 }}
                  className="flex items-start gap-3"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-500/15 text-xs font-semibold text-accent-300">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-300 pt-0.5">{step.label}</span>
                </motion.li>
              ))}
            </ol>
          </motion.div>

          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            onClick={() => {
              if (!isLocationProvided) {
                handleOpenModal('search');
              } else {
                onReview();
              }
            }}
            className={`group mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white shadow-glow-soft transition-all ${
              isLocationProvided
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 hover:-translate-y-0.5 cursor-pointer'
                : 'bg-pending-500/80 hover:bg-pending-500 cursor-pointer'
            }`}
          >
            {isLocationProvided ? 'Review complaint' : 'Add Location to Continue'}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </motion.button>
        </>
      )}
    </motion.div>
  );
}

function Field({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl glass p-4 text-left"
    >
      <div className="flex items-center gap-2 text-accent-300/70">
        {icon}
        <span className="text-[11px] font-semibold tracking-wider uppercase">{label}</span>
      </div>
      <p className="mt-2 text-[15px] font-medium text-white truncate">{value}</p>
    </motion.div>
  );
}
