import { lightColors, darkColors, getThemeColors } from '../../src/theme/tokens';

describe('Finly Theme System & Dark Mode Tokens', () => {
  it('should return lightColors when isDark is false', () => {
    const colors = getThemeColors(false);
    expect(colors).toBe(lightColors);
    expect(colors.background).toBe('#F8FAFC');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.textPrimary).toBe('#0F172A');
  });

  it('should return darkColors when isDark is true', () => {
    const colors = getThemeColors(true);
    expect(colors).toBe(darkColors);
    expect(colors.background).toBe('#0B1120'); // Deep obsidian navy to eliminate night glare
    expect(colors.surface).toBe('#131D31');    // Elevated card layer with subtle sheen
    expect(colors.textPrimary).toBe('#F8FAFC'); // High contrast legible text
    expect(colors.border).toBe('#1E2D4A');
  });

  it('should ensure darkColors has identical key contract as lightColors', () => {
    const lightKeys = Object.keys(lightColors).sort();
    const darkKeys = Object.keys(darkColors).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it('should verify night eye-strain reduction palette properties', () => {
    // Background should not be blinding pure white (#FFFFFF) or pure harsh black (#000000)
    expect(darkColors.background).toBe('#0B1120');
    // Primary fintech blue should be luminous on dark backgrounds
    expect(darkColors.primary).toBe('#3B82F6');
    // Subtle secondary text
    expect(darkColors.textSecondary).toBe('#94A3B8');
  });
});

