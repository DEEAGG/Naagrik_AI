import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CivicBackground from '@/components/CivicBackground';
import Hero from '@/components/Hero';
import HowItWorksSection from '@/components/HowItWorksSection';
import RecentActivitySection from '@/components/RecentActivitySection';
import ProcessingSequence from '@/components/ProcessingSequence';
import AnalysisView from '@/components/AnalysisView';
import ComplaintReview from '@/components/ComplaintReview';
import VerificationView from '@/components/VerificationView';
import AgentExecutionTimeline from '@/components/AgentExecutionTimeline';
import SuccessView from '@/components/SuccessView';
import { runProcessing, analyzeComplaint, getProcessingSteps } from '@/services/agentService';
import { submitComplaint } from '@/services/complaintService';
import { generateOfficialComplaintLetter, generateCombinedComplaintLetter, groupIssuesByAuthority } from '@/services/aiService';
import { AGENT_PLAN } from '@/data/mockData';
import type { AnalysisResult, ProcessingStep, LocationData, MultiIssueQueueState } from '@/types';

type Stage = 'hero' | 'processing' | 'analysis' | 'review' | 'verify' | 'executing' | 'success';

export default function HomePage() {
  const [text, setText] = useState('');
  const [locationData, setLocationData] = useState<LocationData>({
    address: 'Location Not Specified',
    source: 'unspecified',
  });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>('hero');
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [multiIssueQueue, setMultiIssueQueue] = useState<MultiIssueQueueState | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult>({
    issueTitle: '',
    issue: '',
    description: '',
    category: 'General Civic Issue',
    authority: '',
    location: '',
  });
  const [complaintId, setComplaintId] = useState('');

  const runAnalysisPipeline = useCallback(
    async (inputText: string, currentLocData?: LocationData) => {
      setStage('processing');
      setMultiIssueQueue(null);
      const initial = getProcessingSteps();
      if (initial.length > 0) {
        initial[0].status = 'active';
      }
      setSteps(initial);

      const activeLoc = currentLocData || locationData;

      // Non-blocking background step indicator while waiting for AI network response
      let isAIComplete = false;
      const timer = setInterval(() => {
        if (isAIComplete) return;
        setSteps((prevSteps) => {
          const next = prevSteps.map((s) => ({ ...s }));
          const activeIndex = next.findIndex((s) => s.status === 'active');
          if (activeIndex >= 0 && activeIndex < next.length - 1) {
            next[activeIndex].status = 'done';
            next[activeIndex + 1].status = 'active';
          }
          return next;
        });
      }, 250);

      try {
        // Execute AI analysis directly without artificial sequential blocking
        const result = await analyzeComplaint({
          text: inputText,
          evidenceCount: evidenceFiles.length,
          userLocation: activeLoc.address,
          userLocationData: activeLoc,
        });

        isAIComplete = true;
        clearInterval(timer);

        // Mark all steps done and immediately transition to AnalysisView
        setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
        setAnalysis(result);
        if (result.locationData) {
          setLocationData(result.locationData);
        }
        setStage('analysis');
      } catch (error) {
        isAIComplete = true;
        clearInterval(timer);
        console.error('[Naagrik AI Pipeline] Analysis pipeline error:', error);
      }
    },
    [evidenceFiles.length, locationData]
  );

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    runAnalysisPipeline(text);
  }, [text, runAnalysisPipeline]);

  const handleLocationDataSelected = useCallback((locData: LocationData) => {
    setLocationData(locData);
    setAnalysis((prev) => {
      const isValidLoc =
        locData.address &&
        locData.address !== 'Location Not Specified' &&
        locData.address !== 'Not specified (Optional)' &&
        locData.address !== 'unspecified';

      const updatedLetter =
        isValidLoc && prev.issueTitle && prev.authority
          ? generateOfficialComplaintLetter({
              authority: prev.authority,
              issueTitle: prev.issueTitle || prev.issue || 'Civic Issue',
              location: locData.address,
              description: prev.description || '',
            })
          : prev.complaintLetter;

      return {
        ...prev,
        location: locData.address,
        locationData: locData,
        complaintLetter: updatedLetter || prev.complaintLetter,
        isOptionalEnhancement: false,
      };
    });
  }, []);

  const handleEvidenceChange = useCallback((files: File[]) => {
    setEvidenceFiles(files);
  }, []);

  const handleAnswerClarification = useCallback(
    (answer: string) => {
      const updatedText = `${text} (Additional detail: ${answer})`;
      setText(updatedText);
      runAnalysisPipeline(updatedText);
    },
    [text, runAnalysisPipeline]
  );

  const handleSelectOption = useCallback(
    (option: string) => {
      const updatedText = `${text} (${option})`;
      setText(updatedText);
      runAnalysisPipeline(updatedText);
    },
    [text, runAnalysisPipeline]
  );

  const handleSelectMultiIssueMode = useCallback(
    (mode: 'split' | 'combine') => {
      if (mode === 'split' && analysis.detectedIssues && analysis.detectedIssues.length > 0) {
        const drafts = analysis.detectedIssues;
        setMultiIssueQueue({
          mode: 'separate',
          drafts,
          currentIndex: 0,
          completedIds: [],
          failedIndices: [],
        });

        const firstDraft = drafts[0];
        setAnalysis({
          issueTitle: firstDraft.title,
          issue: firstDraft.title,
          category: firstDraft.category as any,
          authority: firstDraft.authority,
          authorityWebsite: firstDraft.authorityWebsite,
          location: firstDraft.location || locationData.address,
          locationData: firstDraft.locationData || locationData,
          description: firstDraft.description,
          complaintLetter: firstDraft.complaintLetter,
          isSufficient: true,
          needsClarification: false,
          multiIssueDetected: false,
        });
        setStage('analysis');
      } else if (mode === 'combine' && analysis.detectedIssues && analysis.detectedIssues.length > 0) {
        const drafts = analysis.detectedIssues;
        const groups = groupIssuesByAuthority(drafts);
        const combinedLetter = generateCombinedComplaintLetter(drafts, locationData.address);
        const combinedAuthorities = groups.map((g) => g.authority).join(', ');
        const primaryWebsite = groups[0]?.authorityWebsite || 'https://mcdonline.nic.in/';

        setMultiIssueQueue({
          mode: 'combine',
          drafts,
          currentIndex: 0,
          completedIds: [],
          failedIndices: [],
          authorityGroups: groups,
        });

        setAnalysis({
          issueTitle: 'Multiple Civic Issues Reported',
          issue: 'Multiple Civic Issues Reported',
          category: 'Multiple Issues' as any,
          authority: combinedAuthorities,
          authorityWebsite: primaryWebsite,
          location: locationData.address,
          locationData: locationData,
          description: `Combined report containing ${drafts.length} distinct civic issues: ${drafts.map((d) => d.title).join('; ')}.`,
          complaintLetter: combinedLetter,
          isSufficient: true,
          needsClarification: false,
          multiIssueDetected: false,
        });
        setStage('analysis');
      } else {
        setAnalysis((prev) => ({
          ...prev,
          multiIssueDetected: false,
          needsClarification: false,
          isSufficient: true,
        }));
      }
    },
    [analysis, locationData]
  );

  const handleUpdateAnalysis = useCallback((updated: Partial<AnalysisResult>) => {
    setAnalysis((prev) => {
      const next = { ...prev, ...updated };
      if (updated.locationData) {
        setLocationData(updated.locationData);
      }
      return next;
    });
  }, []);

  const [citizenReferenceNumber, setCitizenReferenceNumber] = useState<string | undefined>();

  const handleApprove = useCallback(async () => {
    setStage('verify');
  }, []);

  const handleVerify = useCallback((refNum?: string) => {
    setCitizenReferenceNumber(refNum);
    setStage('executing');
  }, []);

  const handleExecuteComplete = useCallback(async () => {
    const { id } = await submitComplaint({
      title: analysis.issueTitle || analysis.issue,
      description: analysis.description || text,
      complaintLetter: analysis.complaintLetter,
      category: analysis.category,
      authority: analysis.authority,
      authorityWebsite: analysis.authorityWebsite,
      location: analysis.locationData?.address || analysis.location,
      locationData: analysis.locationData || locationData,
      evidenceCount: evidenceFiles.length,
      referenceNumber: citizenReferenceNumber,
    });

    if (multiIssueQueue && multiIssueQueue.mode === 'separate') {
      const nextIndex = multiIssueQueue.currentIndex + 1;
      const newCompletedIds = [...multiIssueQueue.completedIds, id];

      if (nextIndex < multiIssueQueue.drafts.length) {
        const nextDraft = multiIssueQueue.drafts[nextIndex];
        setMultiIssueQueue({
          ...multiIssueQueue,
          currentIndex: nextIndex,
          completedIds: newCompletedIds,
        });

        setAnalysis({
          issueTitle: nextDraft.title,
          issue: nextDraft.title,
          category: nextDraft.category as any,
          authority: nextDraft.authority,
          authorityWebsite: nextDraft.authorityWebsite,
          location: locationData.address,
          locationData: locationData,
          description: nextDraft.description,
          complaintLetter: nextDraft.complaintLetter,
          isSufficient: true,
          needsClarification: false,
          multiIssueDetected: false,
        });

        setStage('analysis');
        return;
      } else {
        setComplaintId(newCompletedIds.join(', '));
        setStage('success');
        return;
      }
    }

    setComplaintId(id);
    setStage('success');
  }, [text, analysis, locationData, evidenceFiles.length, multiIssueQueue]);

  const reset = useCallback(() => {
    setText('');
    setLocationData({ address: 'Location Not Specified', source: 'unspecified' });
    setEvidenceFiles([]);
    setStage('hero');
    setSteps([]);
    setMultiIssueQueue(null);
  }, []);

  const zoom = stage !== 'hero';

  return (
    <div className="relative min-h-screen">
      <CivicBackground zoom={zoom} />

      <AnimatePresence mode="wait">
        {stage === 'hero' && (
          <motion.div key="hero">
            <Hero
              value={text}
              onChange={setText}
              onSubmit={handleSubmit}
              onLocationDataSelected={handleLocationDataSelected}
              onEvidenceChange={handleEvidenceChange}
              currentLocationData={locationData}
            />
            <HowItWorksSection />
            <RecentActivitySection />
          </motion.div>
        )}

        {stage === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-24 pb-16"
          >
            <div className="w-full max-w-md text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 border border-accent-400/20"
              >
                <span className="h-3 w-3 rounded-full bg-accent-400 animate-breathe" />
              </motion.div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-white">
                Naagrik is understanding your issue…
              </h2>
              <p className="mt-2 text-sm text-gray-500 italic line-clamp-2">"{text}"</p>
              <div className="mt-8 rounded-2xl glass p-6 text-left">
                <ProcessingSequence steps={steps} />
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'analysis' && (
          <AnalysisView
            key="analysis"
            analysis={analysis}
            locationData={locationData}
            plan={AGENT_PLAN}
            onReview={() => setStage('review')}
            onLocationDataSelected={handleLocationDataSelected}
            onAnswerClarification={handleAnswerClarification}
            onSelectOption={handleSelectOption}
            onSelectMultiIssueMode={handleSelectMultiIssueMode}
          />
        )}

        {stage === 'review' && (
          <ComplaintReview
            key="review"
            analysis={analysis}
            evidenceCount={evidenceFiles.length}
            onApprove={handleApprove}
            onUpdateAnalysis={handleUpdateAnalysis}
            multiIssueQueue={multiIssueQueue}
          />
        )}

        {stage === 'verify' && (
          <VerificationView
            key="verify"
            authority={analysis.authority}
            authorityWebsite={analysis.authorityWebsite}
            issueTitle={analysis.issueTitle || analysis.issue}
            onVerify={handleVerify}
          />
        )}

        {stage === 'executing' && (
          <AgentExecutionTimeline key="executing" onComplete={handleExecuteComplete} />
        )}

        {stage === 'success' && (
          <SuccessView key="success" complaintId={complaintId} onReportAnother={reset} />
        )}
      </AnimatePresence>
    </div>
  );
}
