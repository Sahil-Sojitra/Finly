import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTransactionStore, useSalaryCycleStore } from '@/store';
import { VoiceRecordingModal } from '@/features/voice';
import { formatDisplayDate } from '@/domain/dateUtils';
import { formatPaiseToInr } from '@/utils';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { TransactionType } from '@/types';

export default function TransactionsScreen() {
  const router = useRouter();
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const { transactions, isLoading, fetchTransactions, deleteTransaction } = useTransactionStore();
  const { fetchCycles } = useSalaryCycleStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchTransactions(), fetchCycles()]);
  }, [fetchTransactions, fetchCycles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter((tx) => tx.type === filterType);
  }, [transactions, filterType]);

  const handleDelete = (id: string, description: string) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(id);
            await fetchCycles();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Controls: Voice Button & Add Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.voiceQuickButton}
          onPress={() => setIsVoiceModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="mic" size={18} color="#FFFFFF" />
          <Text style={styles.voiceQuickButtonText}>Voice Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addQuickButton}
          onPress={() => router.push('/transaction/new')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addQuickButtonText}>Add Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterPillsRow}>
        {(['all', 'expense', 'income'] as const).map((tab) => {
          const isActive = filterType === tab;
          const label = tab === 'all' ? 'All' : tab === 'expense' ? 'Expenses' : 'Income';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterPill, isActive && styles.activeFilterPill]}
              onPress={() => setFilterType(tab)}
            >
              <Text style={[styles.filterPillText, isActive && styles.activeFilterPillText]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transactions List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="receipt-outline" size={36} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptySubtitle}>
              Tap &quot;Voice Entry&quot; to speak or &quot;Add Manual&quot; to record your transactions.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isVoice = tx.inputMethod === 'voice';

              return (
                <View key={tx.id} style={styles.txCard}>
                  {/* Category Icon Badge */}
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: (tx.category?.color ?? colors.primary) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={isIncome ? 'arrow-down' : 'arrow-up'}
                      size={20}
                      color={tx.category?.color ?? colors.primary}
                    />
                  </View>

                  {/* Transaction Info */}
                  <View style={styles.txInfoCol}>
                    <View style={styles.descRow}>
                      <Text style={styles.txDescription} numberOfLines={1}>
                        {tx.description}
                      </Text>
                      {isVoice && (
                        <View style={styles.voiceBadge}>
                          <Ionicons name="mic" size={10} color={colors.accent} />
                          <Text style={styles.voiceBadgeText}>Voice</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.txMetaText}>
                      {tx.category?.name ?? 'General'} • {formatDisplayDate(tx.transactionDate)}
                      {tx.notes ? ` • ${tx.notes}` : ''}
                    </Text>
                  </View>

                  {/* Amount and Delete Action */}
                  <View style={styles.txRightCol}>
                    <Text
                      style={[
                        styles.txAmount,
                        isIncome ? styles.incomeText : styles.expenseText,
                      ]}
                    >
                      {isIncome ? '+' : '-'}
                      {formatPaiseToInr(tx.amount)}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleDelete(tx.id, tx.description)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccess={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  voiceQuickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.xl,
    gap: 6,
    ...shadows.sm,
  },
  voiceQuickButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addQuickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.xl,
    gap: 6,
    ...shadows.sm,
  },
  addQuickButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: radii.full,
    padding: 3,
  },
  filterPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  activeFilterPill: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  filterPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeFilterPillText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  listContainer: {
    gap: spacing.sm,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.sm,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfoCol: {
    flex: 1,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txDescription: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
    flexShrink: 1,
  },
  voiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 2,
  },
  voiceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },
  txMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  txAmount: {
    ...typography.bodyLarge,
    fontWeight: '800',
  },
  incomeText: {
    color: colors.success,
  },
  expenseText: {
    color: colors.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
