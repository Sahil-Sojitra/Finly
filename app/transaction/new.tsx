import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCategoryStore, useTransactionStore, useSalaryCycleStore } from '@/store';
import { DEFAULT_CATEGORIES } from '@/database/seeds/defaultCategories';
import { VoiceRecordingModal } from '@/features/voice';
import { parseInrToPaise } from '@/utils';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { TransactionType } from '@/types';

export default function NewTransactionScreen() {
  const router = useRouter();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const { categories, fetchCategories } = useCategoryStore();
  const { addTransaction } = useTransactionStore();
  const { fetchCycles } = useSalaryCycleStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const availableCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const filteredCategories = availableCategories.filter((c) => c.type === type);
  const selectedCategoryId =
    categoryId && filteredCategories.some((c) => c.id === categoryId)
      ? categoryId
      : (filteredCategories[0]?.id ?? '');

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount in ₹.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a description for this transaction.');
      return;
    }

    setIsSaving(true);
    try {
      const amountPaise = parseInrToPaise(amount);
      const id = Crypto.randomUUID();

      await addTransaction({
        id,
        type,
        amount: amountPaise,
        description: description.trim(),
        categoryId: selectedCategoryId,
        transactionDate,
        inputMethod: 'manual',
        notes: notes.trim() ? notes.trim() : null,
      });

      // Synchronize salary cycle domain metrics
      await fetchCycles();

      setIsSaving(false);
      router.back();
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Failed to save transaction');
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Prominent Voice Entry Trigger Card */}
        <TouchableOpacity
          style={styles.voicePromptCard}
          onPress={() => setIsVoiceModalOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.voicePromptIcon}>
            <Ionicons name="mic" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.voicePromptTextCol}>
            <Text style={styles.voicePromptTitle}>Tap to Speak</Text>
            <Text style={styles.voicePromptSubtitle}>
              Add expense or income hands-free with voice
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.orDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Transaction Type Toggle */}
        <View style={styles.typeToggleRow}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActiveExpense]}
            onPress={() => setType('expense')}
          >
            <Ionicons
              name="arrow-up-circle"
              size={18}
              color={type === 'expense' ? '#FFFFFF' : colors.danger}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === 'expense' && styles.typeButtonTextActive,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.typeButtonActiveIncome]}
            onPress={() => setType('income')}
          >
            <Ionicons
              name="arrow-down-circle"
              size={18}
              color={type === 'income' ? '#FFFFFF' : colors.success}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === 'income' && styles.typeButtonTextActive,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Amount (₹)</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Lunch with colleagues, Petrol, Groceries"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Category Pills */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillsScroll}
          >
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catPill,
                    isSelected && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <View style={[styles.catDot, { backgroundColor: isSelected ? '#FFFFFF' : cat.color }]} />
                  <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Transaction Date */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Transaction Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.textInput}
            value={transactionDate}
            onChangeText={setTransactionDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Notes */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add payment method or details"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Transaction</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  voicePromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  voicePromptIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  voicePromptTextCol: {
    flex: 1,
  },
  voicePromptTitle: {
    ...typography.headingSmall,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  voicePromptSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
    ...shadows.sm,
  },
  typeButtonActiveExpense: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  typeButtonActiveIncome: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  typeButtonText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currencySymbol: {
    ...typography.headingLarge,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    ...typography.hero,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  textInput: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    paddingVertical: 4,
  },
  categoryPillsScroll: {
    gap: spacing.xs,
    paddingVertical: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catPillText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.xl,
    gap: spacing.xs,
    marginTop: spacing.sm,
    ...shadows.md,
  },
  saveButtonText: {
    ...typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
