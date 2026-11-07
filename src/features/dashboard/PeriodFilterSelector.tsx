import { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { AnalyticsFilter, AnalyticsFilterType } from '@/domain/analyticsEngine';
import { radii, spacing, typography, useTheme, ThemeColors } from '@/theme';

interface PeriodFilterSelectorProps {
  filter: AnalyticsFilter;
  onFilterChange: (filter: AnalyticsFilter) => void;
  hasActiveCycle: boolean;
}

export function PeriodFilterSelector({
  filter,
  onFilterChange,
  hasActiveCycle,
}: PeriodFilterSelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(
    filter.customStartDate ?? new Date().toISOString().slice(0, 10)
  );
  const [customEnd, setCustomEnd] = useState(
    filter.customEndDate ?? new Date().toISOString().slice(0, 10)
  );

  const filterOptions: { key: AnalyticsFilterType; label: string }[] = [
    {
      key: 'current_cycle',
      label: hasActiveCycle ? 'Current Cycle' : 'Cycle',
    },
    { key: 'previous_cycle', label: 'Previous' },
    { key: 'all_time', label: 'All-Time' },
    { key: 'custom', label: 'Custom' },
  ];

  const handleSelect = (key: AnalyticsFilterType) => {
    if (key === 'custom') {
      setShowCustomModal(true);
      onFilterChange({
        type: 'custom',
        customStartDate: customStart,
        customEndDate: customEnd,
      });
    } else {
      setShowCustomModal(false);
      onFilterChange({ type: key });
    }
  };

  const handleApplyCustom = () => {
    onFilterChange({
      type: 'custom',
      customStartDate: customStart,
      customEndDate: customEnd,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.pillsRow}>
        {filterOptions.map((opt) => {
          const isActive = filter.type === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.pill, isActive && styles.activePill]}
              onPress={() => handleSelect(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isActive && styles.activePillText]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filter.type === 'custom' && showCustomModal && (
        <View style={styles.customDateContainer}>
          <View style={styles.dateInputWrapper}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <TextInput
              style={styles.dateInput}
              value={customStart}
              onChangeText={setCustomStart}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.dateInputWrapper}>
            <Text style={styles.inputLabel}>End Date</Text>
            <TextInput
              style={styles.dateInput}
              value={customEnd}
              onChangeText={setCustomEnd}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyCustom}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing.sm,
    },
    pillsRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.full,
      padding: 4,
    },
    pill: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.full,
    },
    activePill: {
      backgroundColor: colors.primary,
    },
    pillText: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activePillText: {
      color: '#FFFFFF',
    },
    customDateContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    dateInputWrapper: {
      flex: 1,
    },
    inputLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    dateInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      ...typography.bodyMedium,
      color: colors.textPrimary,
    },
    applyButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radii.md,
      justifyContent: 'center',
    },
    applyButtonText: {
      ...typography.caption,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
