import { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';

interface SafetyRollbackCardProps {
  hasSafetyBackup: boolean;
  onRollback: () => Promise<boolean>;
  disabled?: boolean;
}

export function SafetyRollbackCard({
  hasSafetyBackup,
  onRollback,
  disabled,
}: SafetyRollbackCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  if (!hasSafetyBackup) return null;

  const handleRollbackPress = () => {
    Alert.alert(
      'Roll Back Local Data',
      'This will revert your current database records back to the state saved immediately before your last restore. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Roll Back',
          style: 'destructive',
          onPress: async () => {
            const success = await onRollback();
            if (success) {
              Alert.alert('Rollback Succeeded', 'Your database has been restored to the pre-restore safety state.');
            } else {
              Alert.alert('Rollback Failed', 'Could not rollback to safety snapshot.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="arrow-undo" size={20} color={colors.warning} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>Pre-Restore Safety Snapshot</Text>
          <Text style={styles.subtitle}>
            A snapshot was saved before your last restore operation.
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.rollbackButton}
        onPress={handleRollbackPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="time" size={16} color={isDark ? colors.warning : '#92400E'} />
        <Text style={styles.rollbackButtonText}>Revert to Pre-Restore State</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : '#FFFBEB',
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: isDark ? colors.warning : '#FDE68A',
      ...shadows.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? colors.surfaceSecondary : '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    textCol: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? colors.warning : '#92400E',
    },
    subtitle: {
      fontSize: 12,
      color: isDark ? colors.textSecondary : '#B45309',
      marginTop: 2,
    },
    rollbackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: radii.md,
      backgroundColor: isDark ? colors.surfaceSecondary : '#FEF3C7',
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#FCD34D',
      gap: 6,
    },
    rollbackButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? colors.warning : '#92400E',
    },
  });
