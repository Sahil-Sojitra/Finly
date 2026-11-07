import { StyleSheet, Text, View } from 'react-native';
import { getGreeting, formatFullDate } from '@/domain/dateUtils';
import { colors, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface GreetingHeaderProps {
  currentDate?: string;
}

export function GreetingHeader({ currentDate }: GreetingHeaderProps) {
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

const styles = StyleSheet.create({
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
    borderColor: '#BFDBFE',
  },
});
