export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserExperienceSettings {
  theme: ThemeMode;
  defaultLanding: 'workspace' | 'overview';
  analyticsDensity: 'comfortable' | 'compact';
  qrPrecision: 'H' | 'Q' | 'M';
  soundEffects: boolean;
  emailDigests: boolean;
  thresholdAlerts: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserExperienceSettings = {
  theme: 'system',
  defaultLanding: 'workspace',
  analyticsDensity: 'comfortable',
  qrPrecision: 'H',
  soundEffects: false,
  emailDigests: true,
  thresholdAlerts: true,
};

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem('dynamicqr_theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (e) {}
  return 'system';
}

export function applyTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('dynamicqr_theme', theme);
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    window.dispatchEvent(new CustomEvent('dynamicqr-theme-change', { detail: { theme, isDark } }));
  } catch (e) {}
}

export function getStoredPreferences(): UserExperienceSettings {
  if (typeof window === 'undefined') return DEFAULT_USER_PREFERENCES;
  try {
    const raw = localStorage.getItem('dynamicqr_user_preferences');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_USER_PREFERENCES,
        ...parsed,
        theme: getStoredTheme(),
      };
    }
  } catch (e) {}
  return {
    ...DEFAULT_USER_PREFERENCES,
    theme: getStoredTheme(),
  };
}

export function saveStoredPreferences(prefs: Partial<UserExperienceSettings>): UserExperienceSettings {
  if (typeof window === 'undefined') return DEFAULT_USER_PREFERENCES;
  try {
    const current = getStoredPreferences();
    const updated = { ...current, ...prefs };
    if (prefs.theme) {
      applyTheme(prefs.theme);
    }
    localStorage.setItem('dynamicqr_user_preferences', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('dynamicqr-preferences-change', { detail: updated }));
    return updated;
  } catch (e) {
    return DEFAULT_USER_PREFERENCES;
  }
}
