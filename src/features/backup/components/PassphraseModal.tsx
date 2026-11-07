import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '@/theme';

interface PassphraseModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (passphrase: string, saveLocally: boolean) => void;
  title?: string;
  submitButtonText?: string;
  isConfirmationRequired?: boolean;
}

export function PassphraseModal({
  visible,
  onClose,
  onSubmit,
  title = 'Enter Recovery Passphrase',
  submitButtonText = 'Confirm & Back Up',
  isConfirmationRequired = true,
}: PassphraseModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [saveLocally, setSaveLocally] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = () => {
    if (passphrase.length < 8) {
      Alert.alert(
        'Passphrase Too Short',
        'Your recovery passphrase must be at least 8 characters long (12+ recommended).'
      );
      return;
    }

    if (isConfirmationRequired && passphrase !== confirmPassphrase) {
      Alert.alert(
        'Passphrases Do Not Match',
        'Please verify that both passphrase fields match exactly.'
      );
      return;
    }

    onSubmit(passphrase, saveLocally);
    setPassphrase('');
    setConfirmPassphrase('');
  };

  const isFormValid =
    passphrase.length >= 8 && (!isConfirmationRequired || passphrase === confirmPassphrase);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.headerRow}>
            <View style={styles.lockIcon}>
              <Ionicons name="key" size={20} color={colors.primary} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Finly uses zero-knowledge <Text style={styles.bold}>AES-256-GCM</Text> authenticated
            encryption. Your passphrase never leaves this device.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Recovery Passphrase</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={passphrase}
                onChangeText={setPassphrase}
                placeholder="Enter a strong passphrase"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {isConfirmationRequired && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Passphrase</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassphrase}
                onChangeText={setConfirmPassphrase}
                placeholder="Re-enter your passphrase"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setSaveLocally(!saveLocally)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={saveLocally ? 'checkbox' : 'square-outline'}
              size={20}
              color={saveLocally ? colors.primary : colors.textTertiary}
            />
            <Text style={styles.checkboxText}>
              Remember on this device for automated background backups
            </Text>
          </TouchableOpacity>

          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <Text style={styles.warningText}>
              Keep this passphrase safe! If you restore on a different phone, you must enter this
              exact passphrase to decrypt your backup.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !isFormValid && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={!isFormValid}
            >
              <Text style={styles.submitButtonText}>{submitButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    ...shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  lockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    backgroundColor: '#F8FAFC',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    backgroundColor: '#F8FAFC',
  },
  eyeButton: {
    padding: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
    marginTop: 4,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
