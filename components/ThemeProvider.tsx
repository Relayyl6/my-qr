'use client';

import { useEffect } from 'react';
import { getStoredTheme, applyTheme } from '@/lib/theme';

export default function ThemeProvider() {
  useEffect(() => {
    // 1. Immediately apply theme on mount (recovers from React hydration class reconciliation)
    applyTheme(getStoredTheme());

    // 2. Set up live OS theme listener for System Auto Sync mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const currentTheme = getStoredTheme();
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };

    try {
      mediaQuery.addEventListener('change', handleMediaChange);
    } catch {
      mediaQuery.addListener(handleMediaChange);
    }

    // 3. Listen for cross-tab or in-page storage/preference changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dynamicqr_theme' || e.key === 'dynamicqr_user_preferences') {
        applyTheme(getStoredTheme());
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Observer on document.documentElement: ensure .dark isn't stripped by DOM mutations
    const observer = new MutationObserver(() => {
      const currentTheme = getStoredTheme();
      const shouldBeDark =
        currentTheme === 'dark' ||
        (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const isCurrentlyDark = document.documentElement.classList.contains('dark');
      if (shouldBeDark !== isCurrentlyDark) {
        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } catch {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, []);

  return null;
}
