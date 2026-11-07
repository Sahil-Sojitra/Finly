import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { RuleBasedSuggestion } from '@/domain/insights/insightsTypes';

interface RuleSuggestionsCardProps {
  suggestions: RuleBasedSuggestion[];
}

export function RuleSuggestionsCard({ suggestions }: RuleSuggestionsCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="bulb" size={18} color="#0D9488" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.cardTitle}>Personalized Rule Suggestions</Text>
          <Text style={styles.cardSubtitle}>
            Deterministic guidelines based on current cycle burn
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {suggestions.map((sugg) => (
          <View key={sugg.id} style={styles.suggItem}>
            <View style={styles.suggHeaderRow}>
              <Text style={styles.suggTitle}>{sugg.title}</Text>
              {sugg.formattedSafeDailyLimit && (
                <View style={styles.limitPill}>
                  <Text style={styles.limitPillText}>
                    {sugg.formattedSafeDailyLimit} / day
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.suggRecommendation}>{sugg.recommendation}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(13, 148, 136, 0.2)' : '#CCFBF1',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    textCol: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    cardSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    list: {
      gap: spacing.sm,
    },
    suggItem: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    suggTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    limitPill: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#BFDBFE',
    },
    limitPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    suggRecommendation: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
