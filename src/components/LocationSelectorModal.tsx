import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Bookmark, Plus, Check, Loader2, X, AlertCircle, Search, ArrowRight } from 'lucide-react';
import {
  getCurrentGPSLocation,
  getSavedLocations,
  saveLocation,
  searchLocalitySuggestionsAsync,
  formatCoordinates,
  type LocalitySuggestion,
} from '@/services/locationService';
import type { LocationData, SavedLocation } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: LocationData) => void;
  currentLocation?: LocationData;
  initialTab?: 'search' | 'gps' | 'saved';
}

export default function LocationSelectorModal({
  isOpen,
  onClose,
  onSelectLocation,
  currentLocation,
  initialTab = 'search',
}: Props) {
  const [activeTab, setActiveTab] = useState<'search' | 'gps' | 'saved'>(initialTab);
  const [loadingGps, setLoadingGps] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Suggestions State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocalitySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Confirmation Screen State (Ride-app style)
  const [confirmingLocation, setConfirmingLocation] = useState<LocationData | null>(null);
  const [houseNumber, setHouseNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');

  // Saved locations state
  const [savedLocs, setSavedLocs] = useState<SavedLocation[]>([]);
  const [showAddSaved, setShowAddSaved] = useState(false);
  const [newSavedName, setNewSavedName] = useState('');
  const [newSavedAddress, setNewSavedAddress] = useState('');
  const [newSavedLandmark, setNewSavedLandmark] = useState('');

  const searchTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSavedLocs(getSavedLocations());
      setErrorMsg(null);
      setConfirmingLocation(null);
      fetchSuggestions('');
    }
  }, [isOpen, initialTab]);

  const fetchSuggestions = async (q: string) => {
    setIsSearching(true);
    try {
      const results = await searchLocalitySuggestionsAsync(q);
      setSuggestions(results);
    } catch {
      // Fallback handled inside service
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchSuggestions(q);
    }, 300);
  };

  const handleSelectSuggestion = (sug: LocalitySuggestion) => {
    const locData: LocationData = {
      address: sug.address,
      latitude: sug.latitude,
      longitude: sug.longitude,
      pincode: sug.pincode,
      source: 'manual',
    };
    setConfirmingLocation(locData);
    setPincode(sug.pincode || '');
  };

  const handleConfirmFinalLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingLocation) return;

    const finalLocData: LocationData = {
      ...confirmingLocation,
      houseNumber: houseNumber.trim() || undefined,
      buildingName: buildingName.trim() || undefined,
      landmark: landmark.trim() || undefined,
      pincode: pincode.trim() || confirmingLocation.pincode,
    };

    onSelectLocation(finalLocData);
    onClose();
  };

  const handleUseGPS = async () => {
    setLoadingGps(true);
    setErrorMsg(null);
    try {
      const locData = await getCurrentGPSLocation();
      setLoadingGps(false);
      onSelectLocation(locData);
      onClose();
    } catch (err: any) {
      setLoadingGps(false);
      setErrorMsg(err.message || 'Location permission denied or unavailable.');
    }
  };

  const handleSelectSaved = (saved: SavedLocation) => {
    const locData: LocationData = {
      address: saved.address,
      latitude: saved.latitude,
      longitude: saved.longitude,
      landmark: saved.landmark,
      savedLocationName: saved.name,
      source: 'saved',
    };
    onSelectLocation(locData);
    onClose();
  };

  const handleSaveNewLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSavedName.trim() || !newSavedAddress.trim()) return;

    const saved = saveLocation({
      name: newSavedName.trim(),
      address: newSavedAddress.trim(),
      landmark: newSavedLandmark.trim() || undefined,
    });
    setSavedLocs(getSavedLocations());
    setShowAddSaved(false);
    setNewSavedName('');
    setNewSavedAddress('');
    setNewSavedLandmark('');
    handleSelectSaved(saved);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/10 border border-accent-400/20 text-accent-300">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Select Issue Location</h3>
                <p className="text-xs text-gray-400">Search address, fetch GPS, or choose saved place</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* CONFIRMATION SCREEN (Ride-app style confirmation) */}
          {confirmingLocation ? (
            <form onSubmit={handleConfirmFinalLocation} className="mt-4 space-y-4 text-left">
              <div className="rounded-2xl border border-accent-400/30 bg-accent-500/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-300">Selected Address</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingLocation(null)}
                    className="text-xs text-gray-400 hover:text-white underline"
                  >
                    Change
                  </button>
                </div>
                <h4 className="mt-1 text-sm sm:text-base font-semibold text-white leading-snug">{confirmingLocation.address}</h4>
                {confirmingLocation.latitude && confirmingLocation.longitude && (
                  <p className="mt-1 text-xs font-mono text-accent-300/80">
                    GPS: {formatCoordinates(confirmingLocation.latitude, confirmingLocation.longitude)}
                    {confirmingLocation.accuracy && ` (±${confirmingLocation.accuracy}m)`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">House / Flat No.</label>
                  <input
                    type="text"
                    placeholder="e.g. House No. 42"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-accent-400/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Building / Society</label>
                  <input
                    type="text"
                    placeholder="e.g. Duggal Apartments"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-accent-400/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Primary School"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-accent-400/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 110062"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-accent-400/40"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingLocation(null)}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5"
                >
                  Back to Search
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-2.5 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all"
                >
                  <Check className="h-4 w-4" /> Confirm Location
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Navigation Tabs */}
              <div className="mt-4 flex rounded-xl bg-ink-950 p-1 border border-white/5">
                <button
                  onClick={() => setActiveTab('search')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                    activeTab === 'search'
                      ? 'bg-accent-500/20 text-accent-300 border border-accent-400/30'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                  Search Locality
                </button>
                <button
                  onClick={() => setActiveTab('gps')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                    activeTab === 'gps'
                      ? 'bg-accent-500/20 text-accent-300 border border-accent-400/30'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Current GPS
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                    activeTab === 'saved'
                      ? 'bg-accent-500/20 text-accent-300 border border-accent-400/30'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Saved Places
                </button>
              </div>

              {/* Tab Content */}
              <div className="mt-4 min-h-[220px]">
                {/* 1. SEARCH LOCALITY TAB (Ride-app style search) */}
                {activeTab === 'search' && (
                  <div className="space-y-3 text-left">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search area, colony, or landmark (e.g. Duggal Colony, Saket)"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        autoFocus
                        className="w-full rounded-xl bg-ink-800 border border-white/10 pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-accent-400/40"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3.5 top-3 h-4 w-4 animate-spin text-accent-400" />
                      )}
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {suggestions.length > 0 ? (
                        suggestions.map((sug) => (
                          <div
                            key={sug.id}
                            onClick={() => handleSelectSuggestion(sug)}
                            className="group flex items-center justify-between rounded-xl border border-white/5 bg-ink-800/40 p-3 cursor-pointer hover:border-accent-400/30 hover:bg-accent-500/10 transition-all"
                          >
                            <div>
                              <p className="text-xs font-semibold text-white group-hover:text-accent-300">{sug.address}</p>
                              <p className="text-[10px] text-gray-400">{sug.suburb}, {sug.city} {sug.pincode && `- ${sug.pincode}`}</p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-gray-500 group-hover:text-accent-300 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-gray-500">
                          No locations found. Try typing a nearby landmark, road, or colony.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. GPS TAB */}
                {activeTab === 'gps' && (
                  <div className="space-y-4 text-center py-4">
                    <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
                      Fetch your exact device coordinates for highest reporting precision.
                    </p>

                    {errorMsg && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300 text-left">
                        <AlertCircle className="h-4 w-4 flex-none" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <button
                      onClick={handleUseGPS}
                      disabled={loadingGps}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-3 text-xs font-semibold text-white shadow-glow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {loadingGps ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          Getting your precise location…
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 text-white" />
                          Fetch Device GPS Coordinates
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 3. SAVED PLACES TAB */}
                {activeTab === 'saved' && (
                  <div className="text-left">
                    {!showAddSaved ? (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {savedLocs.map((saved) => (
                          <div
                            key={saved.id}
                            onClick={() => handleSelectSaved(saved)}
                            className="group flex items-start justify-between rounded-xl border border-white/10 bg-ink-800/40 p-3 cursor-pointer hover:border-accent-400/40 hover:bg-accent-500/10 transition-all"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white group-hover:text-accent-300">
                                  {saved.name}
                                </span>
                                {saved.landmark && (
                                  <span className="text-[10px] text-gray-400">({saved.landmark})</span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-gray-300">{saved.address}</p>
                            </div>
                            <span className="text-xs text-accent-400 group-hover:translate-x-0.5 transition-transform">
                              Select →
                            </span>
                          </div>
                        ))}

                        <button
                          onClick={() => setShowAddSaved(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 p-2.5 text-xs font-medium text-gray-400 hover:border-accent-400/50 hover:text-accent-300 transition-colors"
                        >
                          <Plus className="h-4 w-4" /> Save a New Place
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveNewLocation} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase text-accent-300">New Saved Place</span>
                          <button
                            type="button"
                            onClick={() => setShowAddSaved(false)}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Label (e.g. Home, Workplace, College)"
                          value={newSavedName}
                          onChange={(e) => setNewSavedName(e.target.value)}
                          required
                          className="w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-accent-400/40"
                        />
                        <input
                          type="text"
                          placeholder="Full Address"
                          value={newSavedAddress}
                          onChange={(e) => setNewSavedAddress(e.target.value)}
                          required
                          className="w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-accent-400/40"
                        />
                        <input
                          type="text"
                          placeholder="Landmark (Optional)"
                          value={newSavedLandmark}
                          onChange={(e) => setNewSavedLandmark(e.target.value)}
                          className="w-full rounded-xl bg-ink-800 border border-white/10 px-3.5 py-2 text-xs text-white outline-none focus:border-accent-400/40"
                        />
                        <button
                          type="submit"
                          className="w-full rounded-full bg-accent-500 py-2 text-xs font-medium text-white hover:bg-accent-600 transition-colors"
                        >
                          Save & Use Place
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
