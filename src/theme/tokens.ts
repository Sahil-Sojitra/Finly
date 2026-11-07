/**
 * Finly Design Tokens
 * Master Theme System with Light & Dark Mode
 */

export const lightColors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',

  success: '#16A34A',
  successLight: '#DCFCE7',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  danger: '#DC2626',
  dangerLight: '#FEE2E2',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceSecondary: '#F1F5F9',
  surfaceSubtle: '#F8FAFC',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  accent: '#6366F1',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderStrong: '#CBD5E1',

  overlay: 'rgba(15, 23, 42, 0.4)',
} as const;

export const darkColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#1E3A8A',

  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.18)',

  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.18)',

  danger: '#F87171',
  dangerLight: 'rgba(248, 113, 113, 0.18)',

  background: '#0B1120', // Deep obsidian navy to eliminate night glare
  surface: '#131D31',    // Elevated card layer with subtle blue-gray sheen
  surfaceMuted: '#1E293B',
  surfaceSecondary: '#1E293B',
  surfaceSubtle: '#0F172A',

  textPrimary: '#F8FAFC',   // High-contrast clean text
  textSecondary: '#94A3B8', // Soft legible secondary text
  textMuted: '#64748B',
  textTertiary: '#475569',
  textInverse: '#0B1120',

  accent: '#818CF8',

  border: '#1E2D4A',        // Gentle boundary contrast
  borderLight: '#16223B',
  borderStrong: '#2A3C61',

  overlay: 'rgba(0, 0, 0, 0.75)',
} as const;

export type ThemeColors = typeof lightColors;

// Default export for backward compatibility
export const colors = lightColors;

export const getThemeColors = (isDark: boolean): ThemeColors => {
  return (isDark ? darkColors : lightColors) as ThemeColors;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const typography = {
  hero: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800' as const,
  },
  headingLarge: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
  },
  headingMedium: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  headingSmall: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  monoLarge: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums' as const],
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
