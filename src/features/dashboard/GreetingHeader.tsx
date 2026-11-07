import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getGreeting, formatFullDate } from '@/domain/dateUtils';
import { spacing, typography, useTheme, ThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface GreetingHeaderProps {
  currentDate?: string;
}

export function GreetingHeader({ currentDate }: GreetingHeaderProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const today = currentDate ?? new Date().toISOString().slice(0, 10);
  const greeting = getGreeting();
  const dateFormatted = formatFullDate(today);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.date}>{dateFormatted}</Text>
      </View>
      <View style={styles.avatarContainer}>
        <Ionicons name="wallet-outline" size={24} color={colors.primary} />
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    greeting: {
      ...typography.headingMedium,
      color: colors.textPrimary,
    },
    date: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
      marginTop: 2,
    },
    avatarContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#BFDBFE',
    },
  });
