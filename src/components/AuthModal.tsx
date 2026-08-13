import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, ShieldCheck, LogIn, UserPlus, AlertCircle, Loader2, Eye, EyeOff, KeyRound, ArrowLeft, User } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, requestPasswordReset } from '@/services/authService';
import { isSupabaseConfigured } from '@/lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: Props) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetState = () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(false);
  };

  const handleSwitchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    setMode(newMode);
    resetState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      const res = await requestPasswordReset(email.trim());
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg('Password reset link sent! Check your email inbox to set your new password.');
      }
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Please choose a stronger password (at least 6 characters).');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      const res = await signUpWithEmail(email.trim(), password, fullName.trim());
      setLoading(false);

      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg('Account created successfully! Check your email if confirmation is required.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      }
    } else {
      // Sign In mode
      setLoading(true);
      const res = await signInWithEmail(email.trim(), password);
      setLoading(false);

      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg('Signed in successfully.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 800);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md rounded-3xl glass-strong p-6 sm:p-8 shadow-2xl text-left border border-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-500/20 text-accent-300">
                {mode === 'login' ? (
                  <LogIn className="h-4 w-4" />
                ) : mode === 'signup' ? (
                  <UserPlus className="h-4 w-4" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-accent-300">
                {mode === 'login'
                  ? 'Naagrik Account Sign In'
                  : mode === 'signup'
                  ? 'Create Naagrik Account'
                  : 'Reset Password'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Title & Description */}
          <h2 className="mt-4 font-display text-2xl font-semibold text-white">
            {mode === 'login'
              ? 'Sign in to Naagrik AI'
              : mode === 'signup'
              ? 'Join Naagrik AI'
              : 'Forgot Password?'}
          </h2>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            {mode === 'login'
              ? 'Access your saved civic complaints and reference numbers across all your devices.'
              : mode === 'signup'
              ? 'Create a free account to sync your civic complaints securely across all your devices.'
              : 'Enter your account email to receive a secure password reset link.'}
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 flex-none" />
              <span>Supabase environment variables not configured. Account sync runs in session mode.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Full Name Field (Sign Up Mode ONLY) */}
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full rounded-xl bg-ink-800 border border-white/15 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent-400"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-xl bg-ink-800 border border-white/15 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent-400"
                />
              </div>
            </div>

            {/* Password Fields (Sign In & Sign Up Modes) */}
            {mode !== 'forgot' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('forgot')}
                        className="text-[11px] text-accent-300 hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full rounded-xl bg-ink-800 border border-white/15 pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field (Sign Up Mode ONLY) */}
                {mode === 'signup' && (
                  <div>
                    <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-1">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 h-4 w-4 text-gray-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        minLength={6}
                        className="w-full rounded-xl bg-ink-800 border border-white/15 pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 text-gray-400 hover:text-white transition-colors"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 flex-none" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-success-500/10 border border-success-500/20 p-3 text-xs text-success-300">
                <ShieldCheck className="h-4 w-4 flex-none" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 py-3 text-sm font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                <span>
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                </span>
              )}
            </button>
          </form>

          {/* Mode Switch Footers */}
          <div className="mt-5 border-t border-white/10 pt-4 text-center">
            {mode === 'login' && (
              <p className="text-xs text-gray-400">
                Don't have a Naagrik account?{' '}
                <button
                  onClick={() => handleSwitchMode('signup')}
                  className="font-semibold text-accent-300 hover:underline"
                >
                  Create one now
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-xs text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => handleSwitchMode('login')}
                  className="font-semibold text-accent-300 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => handleSwitchMode('login')}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 text-center">
            <ShieldCheck className="h-3.5 w-3.5 text-success-400 flex-none" />
            <span>Naagrik AI never asks for or stores government passwords, OTPs, or CAPTCHA details.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
