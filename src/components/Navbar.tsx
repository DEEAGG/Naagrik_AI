import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Settings, Home, ListChecks, Bot, User, Sparkles, LogIn, LogOut } from 'lucide-react';
import { getUserProfile } from '@/services/profileService';
import { onAuthChange, signOutUser } from '@/services/authService';
import AuthModal from '@/components/AuthModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const HOW_IT_WORKS = [
  { step: '01 — Describe the Problem', desc: 'Tell Naagrik AI what happened in your own words. You can write in English, Hindi, or Hinglish.' },
  { step: '02 — AI Understands the Issue', desc: 'Naagrik AI interprets your complaint, identifies the issue and category, and converts it into a clear professional complaint.' },
  { step: '03 — Add Location & Review', desc: 'Confirm where the issue occurred, review the complaint, and make any changes before submission.' },
  { step: '04 — Submit & Track', desc: 'Your complaint is routed toward the responsible authority and you can track its status from one place.' },
];

const NAV = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'My Issues', to: '/issues', icon: ListChecks },
  { label: 'Agent', to: '/agent', icon: Bot },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    setMenuOpen(false);
  };

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMenuOpen(false);
    setOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-3 flex items-center justify-between rounded-2xl glass px-4 sm:px-5 py-3">
          {/* Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-glow-soft">
              <span className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
              <span className="h-2 w-2 rounded-full bg-white animate-breathe" />
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight text-white">
              Naagrik <span className="text-accent-300">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-4 py-2 rounded-full text-sm transition-colors ${
                    active ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/5 border border-white/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setHowOpen(true)}
              className="btn-ghost hidden lg:inline-flex"
            >
              How it works
            </button>
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/5 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success-400" />
              </span>
              <span className="text-xs font-medium text-gray-300">Agent Online</span>
            </div>

            {/* Profile / Auth Button */}
            {currentUser ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-9 items-center gap-2 px-3 rounded-full bg-gradient-to-br from-accent-500/20 to-accent-600/10 ring-1 ring-accent-400/30 hover:ring-accent-400/60 transition-all text-xs text-white"
                  aria-label="Profile and account settings"
                >
                  <User className="h-3.5 w-3.5 text-accent-300" />
                  <span className="truncate max-w-[120px] font-medium text-xs">
                    {currentUser.user_metadata?.full_name || currentUser.email}
                  </span>
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl glass-strong p-2 z-20 text-left"
                      >
                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                          <p className="text-xs font-semibold text-white truncate">
                            {currentUser.user_metadata?.full_name || currentUser.email}
                          </p>
                          {currentUser.user_metadata?.full_name && (
                            <p className="text-[11px] text-gray-400 truncate">{currentUser.email}</p>
                          )}
                          <p className="text-[10px] font-mono text-accent-300 mt-0.5">Cloud Account Active</p>
                        </div>
                        <Link
                          to="/settings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Settings className="h-3.5 w-3.5" /> Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                        >
                          <LogOut className="h-3.5 w-3.5" /> Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-gray-200 hover:border-accent-400/40 hover:text-white transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-full glass text-gray-200"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="md:hidden mt-2 rounded-2xl glass-strong p-3 space-y-1 text-left"
            >
              {currentUser && (
                <div className="px-3 py-2 border-b border-white/10 mb-2">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {currentUser.user_metadata?.full_name || currentUser.email}
                  </p>
                  {currentUser.user_metadata?.full_name && (
                    <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                  )}
                </div>
              )}

              {NAV.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${
                      active ? 'bg-white/5 text-white' : 'text-gray-300'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  setHowOpen(true);
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300 w-full text-left"
              >
                <Sparkles className="h-4 w-4" /> How it works
              </button>

              <div className="pt-2 border-t border-white/10 mt-2">
                {currentUser ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-rose-300 hover:bg-rose-500/10 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                ) : (
                  <div className="flex gap-2 p-1">
                    <button
                      onClick={() => handleOpenAuth('login')}
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-white text-center"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => handleOpenAuth('signup')}
                      className="flex-1 rounded-xl bg-accent-500 py-2 text-xs font-semibold text-white text-center"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* How it works modal */}
      <AnimatePresence>
        {howOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-ink-950/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setHowOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl glass-strong p-6 sm:p-8 shadow-2xl my-auto text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-accent-300">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs font-semibold tracking-wider uppercase">How it works</span>
                </div>
                <button
                  onClick={() => setHowOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-white">
                Tell us the problem. We'll handle the journey.
              </h2>
              <ol className="mt-6 space-y-4">
                {HOW_IT_WORKS.map((h, i) => (
                  <li key={h.step} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-500/15 text-xs font-semibold text-accent-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{h.step}</p>
                      <p className="mt-0.5 text-sm text-gray-400">{h.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
