import { useRef, useState, useEffect, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ImagePlus, MapPin, ArrowRight, Sparkles, X, AlertCircle } from 'lucide-react';
import LocationSelectorModal from '@/components/LocationSelectorModal';
import type { LocationData } from '@/types';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onLocationDataSelected?: (locationData: LocationData) => void;
  onEvidenceChange?: (files: File[]) => void;
  currentLocationData?: LocationData;
  disabled?: boolean;
}

interface ImageItem {
  id: string;
  url: string;
  name: string;
  file: File;
}

export default function AIInput({
  value,
  onChange,
  onSubmit,
  onLocationDataSelected,
  onEvidenceChange,
  currentLocationData,
  disabled,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [listening, setListening] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speech Recognition Duplication Protection Refs
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const committedSpeechRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);

  // Keyboard Enter handler (Enter = submit, Shift+Enter = newline)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim().length > 0 && !disabled) {
        onSubmit();
      }
    }
  };

  // File Attachment Picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files);

    const newItems: ImageItem[] = selectedFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));

    const updated = [...images, ...newItems];
    setImages(updated);
    if (onEvidenceChange) onEvidenceChange(updated.map((i) => i.file));

    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    const updated = images.filter((img) => img.id !== id);
    setImages(updated);
    if (onEvidenceChange) onEvidenceChange(updated.map((i) => i.file));
  };

  // Robust Speech Recognition Setup with Auto-Restart
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Indian SpeechRecognition locale (supports English, Hindi, Hinglish)

      rec.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            interimChunk += transcript;
          }
        }

        if (finalChunk) {
          committedSpeechRef.current += finalChunk;
        }

        const currentSpeech = (committedSpeechRef.current + ' ' + interimChunk).trim();
        const base = baseTextRef.current;
        const combined = base ? `${base} ${currentSpeech}` : currentSpeech;

        onChange(combined);
      };

      rec.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setStatusMessage('Microphone access denied.');
          setListening(false);
          isListeningRef.current = false;
        } else if (event.error !== 'no-speech') {
          setStatusMessage(`Speech error: ${event.error}`);
        }
        setTimeout(() => setStatusMessage(null), 3000);
      };

      rec.onend = () => {
        // Auto-restart if user did not explicitly stop listening
        if (isListeningRef.current) {
          try {
            rec.start();
          } catch {
            setListening(false);
            isListeningRef.current = false;
          }
        } else {
          setListening(false);
        }
      };

      recognitionRef.current = rec;
    }
  }, [onChange]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      setStatusMessage('Speech recognition is not supported in this browser.');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    if (listening) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setListening(false);
      setStatusMessage('Microphone turned off.');
      setTimeout(() => setStatusMessage(null), 2000);
    } else {
      // Store baseline typed text before starting speech session
      baseTextRef.current = value.trim();
      committedSpeechRef.current = '';
      isListeningRef.current = true;
      setListening(true);
      try {
        recognitionRef.current.start();
        setStatusMessage('Listening…');
        setTimeout(() => setStatusMessage(null), 3000);
      } catch {
        setListening(false);
        isListeningRef.current = false;
      }
    }
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  return (
    <motion.div
      animate={{
        boxShadow: focused
          ? '0 0 0 1px rgba(77,134,255,0.35), 0 0 50px -10px rgba(77,134,255,0.4)'
          : '0 0 0 1px rgba(255,255,255,0.06), 0 0 0 rgba(0,0,0,0)',
      }}
      transition={{ duration: 0.3 }}
      className="relative rounded-3xl bg-ink-900/70 backdrop-blur-xl"
    >
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocationData}
        onSelectLocation={(loc) => {
          if (onLocationDataSelected) onLocationDataSelected(loc);
        }}
      />

      <div className="relative rounded-3xl border border-white/10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/50 to-transparent" />

        <div className="p-4 sm:p-5">
          <textarea
            ref={taRef}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              autoGrow(e.target);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="The garbage hasn't been collected from my street for four days…"
            aria-label="Describe the civic issue"
            className="w-full resize-none bg-transparent text-[15px] sm:text-base leading-relaxed text-gray-100 placeholder:text-gray-600 outline-none min-h-[72px]"
          />

          {/* Selected Image Previews */}
          {images.length > 0 && (
            <div className="mt-2 mb-3 flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative group h-14 w-14 rounded-xl overflow-hidden border border-white/15 bg-ink-800">
                  <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink-950/80 text-gray-300 hover:text-white"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Status Message Notification */}
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 flex items-center gap-2 text-xs text-accent-300 bg-accent-500/10 border border-accent-400/20 px-3 py-1.5 rounded-lg"
              >
                <AlertCircle className="h-3.5 w-3.5 flex-none" />
                <span>{statusMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 flex items-center justify-between gap-2">
            {/* Left toolbar */}
            <div className="flex items-center gap-1">
              <ToolButton
                active={listening}
                onClick={toggleSpeechRecognition}
                label="Voice input (Speech to Text)"
              >
                <Mic className={`h-[18px] w-[18px] ${listening ? 'text-accent-400 animate-pulse' : ''}`} />
              </ToolButton>
              <ToolButton
                onClick={() => fileInputRef.current?.click()}
                badge={images.length || undefined}
                label="Attach photo evidence"
              >
                <ImagePlus className="h-[18px] w-[18px]" />
              </ToolButton>
              <ToolButton
                active={currentLocationData && currentLocationData.source !== 'unspecified'}
                onClick={() => setIsLocationModalOpen(true)}
                label="Select location (GPS / Saved / Manual)"
              >
                <MapPin className="h-[18px] w-[18px]" />
              </ToolButton>

              {currentLocationData && currentLocationData.source !== 'unspecified' && (
                <span className="ml-1 text-xs text-accent-300 truncate max-w-[140px]">
                  📍 {currentLocationData.address}
                </span>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={onSubmit}
              disabled={disabled || value.trim().length === 0}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-sm font-medium text-white shadow-glow-soft transition-all hover:shadow-glow disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              aria-label="Let Naagrik handle it"
            >
              <Sparkles className="h-4 w-4 opacity-80" />
              <span>Let Naagrik handle it</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ToolButton({
  children,
  onClick,
  active,
  badge,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
        active
          ? 'bg-accent-500/15 text-accent-300'
          : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
      }`}
    >
      {children}
      {badge ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
