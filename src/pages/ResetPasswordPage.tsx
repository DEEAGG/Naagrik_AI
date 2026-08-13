import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CivicBackground from '@/components/CivicBackground';
import { updateUserPassword } from '@/services/authService';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await updateUserPassword(password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="relative min-h-screen">
      <CivicBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-24 pb-16 text-left">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-3xl glass-strong p-6 sm:p-8 shadow-2xl border border-white/10"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/20 text-accent-300">
              <KeyRound className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-accent-300">
              Password Recovery
            </span>
          </div>

          <h1 className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-white">
            Set New Password
          </h1>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            Enter and confirm your new Naagrik AI account password.
          </p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 space-y-5 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/20 border border-success-400/30 text-success-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Password Reset Complete</h3>
                <p className="text-xs text-gray-300 mt-1">
                  Your password has been updated successfully. You can now use your new password to sign in.
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 py-3 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
              >
                Return to Home & Sign In
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-1">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

              <div>
                <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 block mb-1">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-gray-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
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

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 flex-none" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 py-3 text-sm font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 text-center">
            <ShieldCheck className="h-3.5 w-3.5 text-success-400 flex-none" />
            <span>Naagrik AI never asks for or stores government passwords, OTPs, or CAPTCHA details.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
