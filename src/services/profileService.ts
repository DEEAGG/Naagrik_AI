export interface UserProfile {
  name: string;
  email: string;
  location: string;
  avatarUrl?: string;
  updatedAt: number;
}

const PROFILE_KEY = 'naagrik_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Naagrik User',
  email: 'Not added',
  location: 'Not set',
  updatedAt: Date.now(),
};

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch {
    // Ignore storage parse fallback
  }
  return DEFAULT_PROFILE;
}

export function updateUserProfile(fields: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated: UserProfile = {
    ...current,
    ...fields,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage write fallback
  }
  return updated;
}
