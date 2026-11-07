import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { lightColors, ThemeColors, getThemeColors } from './tokens';
import { SettingsRepository } from '@/database/repositories/settingsRepository';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

export const THEME_STORAGE_KEY = 'theme_preference';

export const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'system',
  isDark: false,
  colors: lightColors,
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let isMounted = true;
    async function loadSavedTheme() {
      try {
        const repo = new SettingsRepository();
        const saved = await repo.get(THEME_STORAGE_KEY);
        if (isMounted && saved && (saved === 'system' || saved === 'light' || saved === 'dark')) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch {
        // Fallback gracefully if database is initializing
      }
    }
    loadSavedTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      const repo = new SettingsRepository();
      await repo.set(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist theme preference:', e);
    }
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemColorScheme === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    return getThemeColors(isDark);
  }, [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      colors,
      setThemeMode,
    }),
    [themeMode, isDark, colors, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
export const useThemeColors = () => useContext(ThemeContext).colors;
