import { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { SpeechService } from '@/services/speechService';
import { VoiceTransactionParser, ParsedVoiceCommand } from '@/domain/voiceParser';
import { useCategoryStore, useTransactionStore, useSalaryCycleStore } from '@/store';
import { DEFAULT_CATEGORIES } from '@/database/seeds/defaultCategories';
import { parseInrToPaise } from '@/utils';
import { radii, shadows, spacing, typography, useTheme, ThemeColors } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { TransactionType } from '@/types';

interface VoiceRecordingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalState = 'idle' | 'listening' | 'processing' | 'confirming' | 'error';

export function VoiceRecordingModal({
  visible,
  onClose,
  onSuccess,
}: VoiceRecordingModalProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedVoiceCommand | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable confirmation form fields
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { categories, fetchCategories } = useCategoryStore();
  const { addTransaction } = useTransactionStore();
  const { fetchCycles } = useSalaryCycleStore();

  const availableCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const handleFinalTranscript = useCallback((text: string) => {
    setModalState('processing');
    const result = VoiceTransactionParser.parse(text);
    setParsed(result);

    // Populate editable fields
    setEditType(result.type);
    setEditAmount(result.amountPaise ? (result.amountPaise / 100).toString() : '');
    setEditDescription(result.description);
    setEditCategoryId(result.categoryId ?? (categories[0]?.id ?? DEFAULT_CATEGORIES[0]!.id));
    setEditDate(result.transactionDate);
    setEditNotes(result.paymentMethod ? `Paid via ${result.paymentMethod}` : '');

    setModalState('confirming');
  }, [categories]);

  // Speech Recognition Event Listeners
  useSpeechRecognitionEvent('start', () => {
    setModalState('listening');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);

    if (event.isFinal && text.trim().length > 0) {
      handleFinalTranscript(text);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    let msg = 'Speech recognition error occurred.';
    if (event.error === 'not-allowed') {
      msg = 'Microphone permission was denied. Please grant permission in settings.';
    } else if (event.error === 'no-speech') {
      msg = 'No speech detected. Please speak closer to your microphone.';
    } else if (event.error === 'network') {
      msg = 'Network connection needed for online speech recognizer.';
    }
    setErrorMessage(msg);
    setModalState('error');
  });

  useSpeechRecognitionEvent('end', () => {
    if (transcript.trim().length > 0) {
      handleFinalTranscript(transcript);
    }
  });

  const startListening = async () => {
    fetchCategories();
    setErrorMessage(null);
    setTranscript('');
    setParsed(null);

    const perm = await SpeechService.requestPermissions();
    if (!perm.granted) {
      setErrorMessage(
        'Microphone permission is required for voice entry. Please enable it in system settings.'
      );
      setModalState('error');
      return;
    }

    try {
      setModalState('listening');
      SpeechService.start();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start speech recognition');
      setModalState('error');
    }
  };

  const stopListening = () => {
    SpeechService.stop();
    if (transcript.trim().length > 0) {
      handleFinalTranscript(transcript);
    } else {
      setModalState('idle');
    }
  };

  const cancelListening = () => {
    SpeechService.abort();
    setModalState('idle');
    setTranscript('');
    setParsed(null);
    onClose();
  };

  // Demo simulator commands for fallback and testing on simulators
  const sampleCommands = [
    'Add shoes for 500 rupees today.',
    'I spent 200 on lunch.',
    'Add 150 rupees petrol yesterday.',
    'Received 5000 rupees from freelancing.',
    '500 rupay petrol me kharcha hua',
    'Salary mila 40000',
  ];

  const handleSimulateCommand = (cmd: string) => {
    setTranscript(cmd);
    handleFinalTranscript(cmd);
  };

  // Confirm and Save handler
  const handleConfirmAndSave = async () => {
    if (!editAmount || parseFloat(editAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (!editDescription.trim()) {
      Alert.alert('Missing Description', 'Please enter a description for this transaction.');
      return;
    }

    setIsSaving(true);
    try {
      const amountPaise = parseInrToPaise(editAmount);
      const id = Crypto.randomUUID();

      await addTransaction({
        id,
        type: editType,
        amount: amountPaise,
        description: editDescription.trim(),
        categoryId: editCategoryId,
        transactionDate: editDate,
        inputMethod: 'voice',
        notes: editNotes ? editNotes.trim() : null,
      });

      // Synchronize salary cycle domain metrics
      await fetchCycles();

      setIsSaving(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setIsSaving(false);
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Failed to save transaction');
    }
  };

  const filteredCategories = availableCategories.filter((c) => c.type === editType);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={startListening}
      onRequestClose={cancelListening}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <View style={styles.micIconBox}>
                <Ionicons
                  name={modalState === 'listening' ? 'mic' : 'mic-outline'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.sheetTitle}>Voice Transaction Entry</Text>
            </View>
            <TouchableOpacity onPress={cancelListening} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 1. LISTENING STATE */}
          {modalState === 'listening' && (
            <View style={styles.listeningContainer}>
              <View style={styles.pulsingRing}>
                <View style={styles.innerMicCircle}>
                  <Ionicons name="mic" size={40} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.listeningPrompt}>Listening to your command...</Text>
              <Text style={styles.listeningHint}>
                Say &quot;Spent 200 on lunch&quot; or &quot;500 rupay petrol yesterday&quot;
              </Text>

              {transcript ? (
                <View style={styles.liveTranscriptBox}>
                  <Text style={styles.liveTranscriptText}>&ldquo;{transcript}&rdquo;</Text>
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.stopButton]}
                  onPress={stopListening}
                >
                  <Ionicons name="stop" size={18} color="#FFFFFF" />
                  <Text style={styles.stopButtonText}>Done Speaking</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cancelListening}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {/* Sample test chips for simulators/devices without mic */}
              <View style={styles.sampleChipsContainer}>
                <Text style={styles.sampleSectionTitle}>Or tap a sample to simulate:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {sampleCommands.map((cmd, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.sampleChip}
                      onPress={() => handleSimulateCommand(cmd)}
                    >
                      <Text style={styles.sampleChipText}>{cmd}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* 2. PROCESSING STATE */}
          {modalState === 'processing' && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.processingText}>Parsing financial command...</Text>
            </View>
          )}

          {/* 3. CONFIRMATION & EDITING STATE */}
          {modalState === 'confirming' && (
            <ScrollView style={styles.confirmScroll} showsVerticalScrollIndicator={false}>
              {/* Spoken Quote Banner */}
              <View style={styles.quoteBanner}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                <Text style={styles.quoteText}>&ldquo;{parsed?.rawText}&rdquo;</Text>
              </View>

              {parsed?.clarificationPrompt && (
                <View style={styles.warningBanner}>
                  <Ionicons name="information-circle" size={16} color="#B45309" />
                  <Text style={styles.warningText}>{parsed.clarificationPrompt}</Text>
                </View>
              )}

              {/* Transaction Type Segmented Toggle */}
              <View style={styles.typeToggleRow}>
                <TouchableOpacity
                  style={[styles.typeButton, editType === 'expense' && styles.typeButtonActiveExpense]}
                  onPress={() => setEditType('expense')}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={16}
                    color={editType === 'expense' ? '#FFFFFF' : colors.danger}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      editType === 'expense' && styles.typeButtonTextActive,
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeButton, editType === 'income' && styles.typeButtonActiveIncome]}
                  onPress={() => setEditType('income')}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={16}
                    color={editType === 'income' ? '#FFFFFF' : colors.success}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      editType === 'income' && styles.typeButtonTextActive,
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Amount Input */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Amount (₹)</Text>
                <TextInput
                  style={styles.amountInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* Description Input */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="What was this for?"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* Category Pills */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsScroll}>
                  {filteredCategories.map((cat) => {
                    const isSelected = editCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catPill,
                          isSelected && { backgroundColor: cat.color },
                        ]}
                        onPress={() => setEditCategoryId(cat.id)}
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
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* Notes / Payment method */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={styles.textInput}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Optional payment method or note"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* Actions: Re-record vs Confirm & Save */}
              <View style={styles.confirmActionsRow}>
                <TouchableOpacity
                  style={styles.rerecordButton}
                  onPress={startListening}
                >
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.rerecordButtonText}>Re-record</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleConfirmAndSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Confirm & Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* 4. ERROR STATE */}
          {modalState === 'error' && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconBox}>
                <Ionicons name="warning-outline" size={36} color={colors.danger} />
              </View>
              <Text style={styles.errorTitle}>Recognition Failed</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>

              <View style={styles.errorActions}>
                <TouchableOpacity style={styles.retryButton} onPress={startListening}>
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Retry Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.manualFallbackButton} onPress={cancelListening}>
                  <Text style={styles.manualFallbackText}>Close / Manual Entry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      padding: spacing.lg,
      maxHeight: '90%',
      ...shadows.lg,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    micIconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sheetTitle: {
      ...typography.headingSmall,
      color: colors.textPrimary,
    },
    listeningContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    pulsingRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    innerMicCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listeningPrompt: {
      ...typography.headingSmall,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    listeningHint: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    liveTranscriptBox: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radii.lg,
      padding: spacing.md,
      width: '100%',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    liveTranscriptText: {
      ...typography.bodyLarge,
      fontStyle: 'italic',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
      marginBottom: spacing.lg,
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radii.lg,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    stopButton: {
      backgroundColor: colors.primary,
    },
    stopButtonText: {
      ...typography.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    cancelButton: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    sampleChipsContainer: {
      width: '100%',
      paddingTop: spacing.sm,
    },
    sampleSectionTitle: {
      ...typography.caption,
      color: colors.textTertiary,
      marginBottom: spacing.xs,
    },
    chipsScroll: {
      gap: spacing.xs,
    },
    sampleChip: {
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sampleChipText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    processingContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.md,
    },
    processingText: {
      ...typography.bodyMedium,
      color: colors.textSecondary,
    },
    confirmScroll: {
      maxHeight: 480,
    },
    quoteBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surfaceSecondary : colors.primaryLight,
      padding: spacing.md,
      borderRadius: radii.lg,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    quoteText: {
      ...typography.bodyMedium,
      color: isDark ? colors.textPrimary : colors.primaryDark,
      fontStyle: 'italic',
      flex: 1,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7',
      padding: spacing.sm,
      borderRadius: radii.md,
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    warningText: {
      ...typography.caption,
      color: isDark ? colors.warning : '#92400E',
      flex: 1,
    },
  typeToggleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    gap: 6,
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
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  amountInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    ...typography.headingMedium,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  categoryPillsScroll: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
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
    fontWeight: '500',
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  rerecordButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  rerecordButtonText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '700',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    gap: 6,
  },
  saveButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.headingSmall,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  errorActions: {
    width: '100%',
    gap: spacing.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    gap: 6,
  },
  retryButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  manualFallbackButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  manualFallbackText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
