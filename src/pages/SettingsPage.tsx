import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Bot, ShieldCheck, ArrowLeft, Check, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CivicBackground from '@/components/CivicBackground';
import { getUserProfile, updateUserProfile } from '@/services/profileService';

const SETTINGS_KEY = 'naagrik_settings';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 flex-none rounded-full transition-colors ${
        on ? 'bg-accent-500' : 'bg-white/10'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();

  // Settings State
  const [askBefore, setAskBefore] = useState(true);
  const [autoMonitor, setAutoMonitor] = useState(true);
  const [notif, setNotif] = useState(true);

  // Profile Form State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load Settings and Profile on Mount
  useEffect(() => {
    // Load Settings
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.askBefore === 'boolean') setAskBefore(parsed.askBefore);
        if (typeof parsed.autoMonitor === 'boolean') setAutoMonitor(parsed.autoMonitor);
        if (typeof parsed.notif === 'boolean') setNotif(parsed.notif);
      }
    } catch {
      // Ignore parse error
    }

    // Load Profile
    const p = getUserProfile();
    setProfileName(p.name);
    setProfileEmail(p.email);
    setProfileLocation(p.location);
  }, []);

  // Save Settings to LocalStorage whenever toggled
  const handleToggleAskBefore = (val: boolean) => {
    setAskBefore(val);
    saveSettings({ askBefore: val, autoMonitor, notif });
  };

  const handleToggleAutoMonitor = (val: boolean) => {
    setAutoMonitor(val);
    saveSettings({ askBefore, autoMonitor: val, notif });
  };

  const handleToggleNotif = (val: boolean) => {
    setNotif(val);
    saveSettings({ askBefore, autoMonitor, notif: val });
  };

  const saveSettings = (newSettings: { askBefore: boolean; autoMonitor: boolean; notif: boolean }) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch {
      // Ignore write error
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: profileName.trim() || 'Naagrik User',
      email: profileEmail.trim() || 'Not added',
      location: profileLocation.trim() || 'Not set',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="relative min-h-screen">
      <CivicBackground />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-lg px-4 pt-24 pb-16"
      >
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-eyebrow">Settings & Profile</div>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-white">Settings</h1>

        {/* User Profile Section */}
        <section className="mt-8">
          <SectionTitle icon={<User className="h-4 w-4" />}>User Profile</SectionTitle>
          <form onSubmit={handleSaveProfile} className="mt-3 rounded-2xl glass p-5 space-y-4">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-500/20 to-accent-600/10 border border-accent-400/20 text-accent-300">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">{profileName || 'Naagrik User'}</p>
                <p className="text-xs text-gray-400">{profileLocation || 'Not set'}</p>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Naagrik User"
                className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-sm text-white outline-none focus:border-accent-400/40"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="Not added"
                className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-sm text-white outline-none focus:border-accent-400/40"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">Primary Location</label>
              <input
                type="text"
                value={profileLocation}
                onChange={(e) => setProfileLocation(e.target.value)}
                placeholder="Not set"
                className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-sm text-white outline-none focus:border-accent-400/40"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-success-400">
                  <Check className="h-4 w-4" /> Profile saved
                </span>
              ) : (
                <span className="text-xs text-gray-500">Persisted in browser</span>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2 text-xs font-medium text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
              >
                <Save className="h-3.5 w-3.5" /> Save Profile
              </button>
            </div>
          </form>
        </section>

        {/* Notifications */}
        <section className="mt-6">
          <SectionTitle icon={<Bell className="h-4 w-4" />}>Notifications</SectionTitle>
          <div className="mt-3 space-y-2">
            <SettingRow label="Status updates" desc="Notify when a complaint changes state">
              <Toggle on={notif} onChange={handleToggleNotif} />
            </SettingRow>
          </div>
        </section>

        {/* Agent Preferences */}
        <section className="mt-6">
          <SectionTitle icon={<Bot className="h-4 w-4" />}>Agent preferences</SectionTitle>
          <div className="mt-3 space-y-2">
            <SettingRow
              label="Ask before external actions"
              desc="Naagrik will confirm before submitting to any portal"
            >
              <Toggle on={askBefore} onChange={handleToggleAskBefore} />
            </SettingRow>
            <SettingRow
              label="Automatic status monitoring"
              desc="Continuously check your complaints for status updates"
            >
              <Toggle on={autoMonitor} onChange={handleToggleAutoMonitor} />
            </SettingRow>
          </div>
        </section>

        <div className="mt-8 flex items-center gap-2 text-xs text-gray-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          You stay in control. Naagrik will ask before taking external actions.
        </div>
      </motion.div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-accent-300/80">
      {icon}
      <span className="text-[11px] font-semibold tracking-[0.28em] uppercase">{children}</span>
    </div>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl glass p-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}
