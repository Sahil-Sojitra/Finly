import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSalaryCycleStore } from '@/store';
import { parseInrToPaise } from '@/utils';
import { Button } from '@/components/Button';
import { radii, spacing, typography, useTheme, ThemeColors } from '@/theme';

export default function NewSalaryCycleScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const { recordSalary, cycles, isLoading } = useSalaryCycleStore();

  const isFirstCycle = cycles.length === 0;

  const today = new Date().toISOString().slice(0, 10);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [receivedDate, setReceivedDate] = useState(today);
  const [expectedNextDate, setExpectedNextDate] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const cleanAmount = salaryAmount.replace(/[₹,\s]/g, '');
    const num = parseFloat(cleanAmount);
    if (!cleanAmount || isNaN(num) || num <= 0) {
      newErrors.salaryAmount = 'Please enter a valid salary amount greater than zero';
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedDate)) {
      newErrors.receivedDate = 'Date must be formatted as YYYY-MM-DD';
    }

    if (expectedNextDate && !/^\d{4}-\d{2}-\d{2}$/.test(expectedNextDate)) {
      newErrors.expectedNextDate = 'Date must be formatted as YYYY-MM-DD';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const salaryPaise = parseInrToPaise(salaryAmount);
      const openingPaise = isFirstCycle ? parseInrToPaise(openingBalance) : 0;

      await recordSalary({
        salaryAmountPaise: salaryPaise,
        receivedDate,
        expectedNextDate: expectedNextDate ? expectedNextDate.trim() : null,
        openingBalancePaise: openingPaise,
      });

      Alert.alert('Salary Recorded', 'Salary cycle successfully created.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save salary cycle'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.formTitle}>
            {isFirstCycle ? 'Set Up Initial Salary Cycle' : 'Record Received Salary'}
          </Text>
          <Text style={styles.formSubtitle}>
            Finly calculates financial periods based on actual salary receipt dates,
            not artificial calendar months.
          </Text>

          {/* Salary Amount */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Salary Amount (₹) *</Text>
            <View
              style={[
                styles.inputContainer,
                Boolean(errors.salaryAmount) && styles.inputError,
              ]}
            >
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                value={salaryAmount}
                onChangeText={(val) => {
                  setSalaryAmount(val);
                  if (errors.salaryAmount) {
                    setErrors((prev) => ({ ...prev, salaryAmount: '' }));
                  }
                }}
                placeholder="e.g. 75,000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
            {Boolean(errors.salaryAmount) && (
              <Text style={styles.errorText}>{errors.salaryAmount}</Text>
            )}
          </View>

          {/* Received Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Salary Received Date *</Text>
            <View
              style={[
                styles.inputContainer,
                Boolean(errors.receivedDate) && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.input}
                value={receivedDate}
                onChangeText={(val) => {
                  setReceivedDate(val);
                  if (errors.receivedDate) {
                    setErrors((prev) => ({ ...prev, receivedDate: '' }));
                  }
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Text style={styles.hintText}>
              The exact date this salary hit your account.
            </Text>
            {Boolean(errors.receivedDate) && (
              <Text style={styles.errorText}>{errors.receivedDate}</Text>
            )}
          </View>

          {/* Expected Next Salary Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Expected Next Payday (Optional)</Text>
            <View
              style={[
                styles.inputContainer,
                Boolean(errors.expectedNextDate) && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.input}
                value={expectedNextDate}
                onChangeText={(val) => {
                  setExpectedNextDate(val);
                  if (errors.expectedNextDate) {
                    setErrors((prev) => ({ ...prev, expectedNextDate: '' }));
                  }
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Text style={styles.hintText}>
              Estimated end date for burn-rate and daily budget projections.
            </Text>
            {Boolean(errors.expectedNextDate) && (
              <Text style={styles.errorText}>{errors.expectedNextDate}</Text>
            )}
          </View>

          {/* Initial Opening Balance (Only shown for first cycle ever) */}
          {isFirstCycle && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Initial Bank Balance (₹)</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={openingBalance}
                  onChangeText={setOpeningBalance}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.infoAlert}>
                Existing money in your account prior to this salary. Subsequent cycles
                automatically carry forward remaining balances deterministically.
              </Text>
            </View>
          )}

          <Button
            title="Confirm & Record Cycle"
            onPress={handleSubmit}
            loading={isLoading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    keyboardView: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.lg,
      alignItems: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      maxWidth: 500,
      width: '100%',
    },
    formTitle: {
      ...typography.headingMedium,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    formSubtitle: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      lineHeight: 20,
    },
    fieldGroup: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: spacing.md,
      minHeight: 48,
    },
    inputError: {
      borderColor: colors.danger,
    },
    currencyPrefix: {
      ...typography.headingSmall,
      color: colors.textSecondary,
      marginRight: spacing.xs,
    },
    input: {
      flex: 1,
      ...typography.bodyLarge,
      color: colors.textPrimary,
      paddingVertical: spacing.sm,
    },
    hintText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: 4,
    },
    infoAlert: {
      ...typography.bodySmall,
      color: isDark ? '#93C5FD' : colors.primaryDark,
      marginTop: 4,
      backgroundColor: colors.primaryLight,
      padding: spacing.xs,
      borderRadius: radii.sm,
    },
    errorText: {
      ...typography.bodySmall,
      color: colors.danger,
      marginTop: 4,
    },
    submitBtn: {
      marginTop: spacing.md,
    },
  });
