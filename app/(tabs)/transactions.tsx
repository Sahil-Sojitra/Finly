import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export default function TransactionsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>
          Core transaction management and integer-paise financial entry will be wired in Phase 1.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    ...typography.headingMedium,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
