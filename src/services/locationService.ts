import type { LocationData, LocationSource, SavedLocation } from '@/types';

const SAVED_LOCATIONS_KEY = 'naagrik_saved_locations';

export interface LocalitySuggestion {
  id: string;
  address: string;
  suburb: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

const COMMON_DELHI_LOCALITIES: LocalitySuggestion[] = [
  { id: 'loc-1', address: 'Block A, Duggal Colony, Khanpur', suburb: 'Khanpur', city: 'New Delhi', pincode: '110062', latitude: 28.512, longitude: 77.234 },
  { id: 'loc-2', address: 'Block B, Duggal Colony, Sangam Vihar', suburb: 'Sangam Vihar', city: 'New Delhi', pincode: '110080', latitude: 28.508, longitude: 77.241 },
  { id: 'loc-3', address: 'Saket Metro Station, Gate No. 2', suburb: 'Saket', city: 'New Delhi', pincode: '110017', latitude: 28.5204, longitude: 77.2066 },
  { id: 'loc-4', address: 'Green Park Main Market', suburb: 'Green Park', city: 'New Delhi', pincode: '110016', latitude: 28.5588, longitude: 77.2028 },
  { id: 'loc-5', address: 'Lajpat Nagar Central Market', suburb: 'Lajpat Nagar', city: 'New Delhi', pincode: '110024', latitude: 28.5694, longitude: 77.2435 },
  { id: 'loc-6', address: 'Cyber City, Phase 2, Gurugram', suburb: 'Cyber City', city: 'Gurugram', pincode: '122002', latitude: 28.495, longitude: 77.0895 },
  { id: 'loc-7', address: 'Rohini Sector 7, Main Road', suburb: 'Rohini', city: 'Delhi', pincode: '110085', latitude: 28.7158, longitude: 77.1147 },
  { id: 'loc-8', address: 'Dwarka Sector 12 Metro Station', suburb: 'Dwarka', city: 'New Delhi', pincode: '110075', latitude: 28.5921, longitude: 77.046 },
  { id: 'loc-9', address: 'Connaught Place, Inner Circle', suburb: 'Connaught Place', city: 'New Delhi', pincode: '110001', latitude: 28.6315, longitude: 77.2167 },
  { id: 'loc-10', address: 'Preet Vihar Vikas Marg', suburb: 'Preet Vihar', city: 'Delhi', pincode: '110092', latitude: 28.6418, longitude: 77.2965 },
];

/**
 * Real-time Locality Auto-Suggestions Search (Synchronous Fallback)
 */
export function searchLocalitySuggestions(query: string): LocalitySuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMON_DELHI_LOCALITIES.slice(0, 5);

  const matched = COMMON_DELHI_LOCALITIES.filter(
    (l) =>
      l.address.toLowerCase().includes(q) ||
      l.suburb.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.pincode.includes(q)
  );

  if (matched.length > 0) return matched;

  // Dynamic fallback suggestion if query is novel
  return [
    {
      id: `dynamic-${Date.now()}`,
      address: `${query.trim()}, New Delhi`,
      suburb: query.trim(),
      city: 'New Delhi',
      pincode: '1100XX',
    },
    ...COMMON_DELHI_LOCALITIES.slice(0, 3),
  ];
}

/**
 * Real-time Geocoding Search via OpenStreetMap Nominatim API
 */
export async function searchLocalitySuggestionsAsync(query: string): Promise<LocalitySuggestion[]> {
  const q = query.trim();
  if (!q) return COMMON_DELHI_LOCALITIES.slice(0, 5);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any, idx: number) => {
          const parts = (item.display_name || '').split(',');
          const mainAddress = parts.slice(0, 3).join(', ').trim();
          const suburb = parts[0] ? parts[0].trim() : q;
          const city = parts[2] ? parts[2].trim() : 'India';
          return {
            id: `osm-${item.place_id || idx}`,
            address: mainAddress || item.display_name,
            suburb,
            city,
            pincode: item.address?.postcode || '',
            latitude: item.lat ? parseFloat(item.lat) : undefined,
            longitude: item.lon ? parseFloat(item.lon) : undefined,
          };
        });
      }
    }
  } catch {
    // Network fallback to local list
  }

  return searchLocalitySuggestions(q);
}

/**
 * Fetch real browser GPS position and reverse-geocode to a human-readable locality.
 */
export async function getCurrentGPSLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const timestamp = pos.timestamp || Date.now();

        const resolvedAddress = await reverseGeocodeCoordinates(latitude, longitude);

        const locationData: LocationData = {
          address: resolvedAddress,
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          timestamp,
          source: 'gps',
        };

        resolve(locationData);
      },
      (err) => {
        let msg = 'Failed to retrieve location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can still enter your location manually.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location detection timed out.';
        }
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * Reverse geocode latitude and longitude to readable locality text via Nominatim API.
 */
export async function reverseGeocodeCoordinates(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.road ||
          addr.city_district ||
          addr.town ||
          addr.city;
        const city = addr.city || addr.state_district || addr.state || '';
        if (locality) {
          return `${locality}${city ? ', ' + city : ''}`;
        }
      }
    }
  } catch {
    // Network fallback
  }
  return `GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
}

/**
 * LocalStorage Saved Locations Manager
 */
export function getSavedLocations(): SavedLocation[] {
  try {
    const raw = localStorage.getItem(SAVED_LOCATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Storage parse fallback
  }
  return [
    {
      id: 'saved-home-default',
      name: 'Home',
      address: 'Block A, Duggal Colony, New Delhi',
      latitude: 28.512,
      longitude: 77.234,
      landmark: 'Near Main Park',
      pincode: '110062',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'saved-work-default',
      name: 'Workplace',
      address: 'Cyber City, Phase 2, Gurugram',
      latitude: 28.495,
      longitude: 77.0895,
      landmark: 'Building 10',
      pincode: '122002',
      createdAt: Date.now() - 172800000,
    },
  ];
}

export function saveLocation(location: Omit<SavedLocation, 'id' | 'createdAt'>): SavedLocation {
  const existing = getSavedLocations();
  const newSaved: SavedLocation = {
    ...location,
    id: `loc-${Date.now()}`,
    createdAt: Date.now(),
  };
  const updated = [newSaved, ...existing.filter((l) => l.name.toLowerCase() !== location.name.toLowerCase())];
  try {
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(updated));
  } catch {
    // Storage write fallback
  }
  return newSaved;
}

export function deleteSavedLocation(id: string): SavedLocation[] {
  const existing = getSavedLocations();
  const filtered = existing.filter((l) => l.id !== id);
  try {
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(filtered));
  } catch {
    // Storage write fallback
  }
  return filtered;
}

/**
 * Priority Hierarchy Resolver:
 * Manual > Saved > GPS > Extracted > Unspecified
 */
export function resolveLocationPriority(
  current: LocationData | undefined,
  incoming: LocationData | undefined
): LocationData {
  if (!current) return incoming || { address: 'Not specified', source: 'unspecified' };
  if (!incoming) return current;

  const PRIORITY_RANK: Record<LocationSource, number> = {
    manual: 5,
    saved: 4,
    gps: 3,
    extracted: 2,
    unspecified: 1,
  };

  const currentRank = PRIORITY_RANK[current.source] || 1;
  const incomingRank = PRIORITY_RANK[incoming.source] || 1;

  if (incomingRank >= currentRank) {
    return incoming;
  }
  return current;
}

export function formatCoordinates(lat?: number, lon?: number): string | null {
  if (lat === undefined || lon === undefined) return null;
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}
