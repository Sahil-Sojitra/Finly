import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { spacing, typography, useTheme, ThemeColors } from '@/theme';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Transaction Details</Text>
        <Text style={styles.subtitle}>ID: {id}</Text>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    },
  });
