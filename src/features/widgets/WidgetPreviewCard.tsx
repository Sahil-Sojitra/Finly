import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SmallWidgetLayout } from './SmallWidgetLayout';
import { MediumWidgetLayout } from './MediumWidgetLayout';
import { WidgetService } from '@/services/widgetService';
import { WidgetSnapshotData, WidgetSnapshotSerializer } from '@/domain/widgetSnapshot';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export function WidgetPreviewCard() {
  const [snapshot, setSnapshot] = useState<WidgetSnapshotData>(
    WidgetSnapshotSerializer.createFallbackSnapshot()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'both' | 'small' | 'medium'>('both');

  useEffect(() => {
    let isMounted = true;
    WidgetService.getCachedSnapshot().then((cached) => {
      if (isMounted && cached) {
        setSnapshot(cached);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const updated = await WidgetService.syncFromDatabase();
      setSnapshot(updated);
      Alert.alert('Widgets Synchronized', 'Native widgets snapshot updated successfully.');
    } catch (err) {
      Alert.alert('Sync Error', err instanceof Error ? err.message : 'Failed to update widgets');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="apps-outline" size={20} color={colors.primary} />
          <Text style={styles.title}>Home Screen Widgets</Text>
        </View>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSyncNow}
          disabled={isSyncing}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={14} color={colors.primary} />
          <Text style={styles.syncButtonText}>{isSyncing ? 'Syncing...' : 'Sync Widgets'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        Finly supports native Android AppWidgets and iOS WidgetKit. Widgets display live snapshots of your active salary cycle balance and spending.
      </Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['both', 'small', 'medium'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'both' ? 'All Sizes' : tab === 'small' ? 'Small (2x2)' : 'Medium (4x2)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preview Section */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.previewsScroll}
      >
        {(activeTab === 'both' || activeTab === 'small') && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTag}>Small Widget (2x2)</Text>
            <SmallWidgetLayout data={snapshot} />
          </View>
        )}

        {(activeTab === 'both' || activeTab === 'medium') && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTag}>Medium Widget (4x2)</Text>
            <MediumWidgetLayout data={snapshot} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
    gap: 4,
  },
  syncButtonText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.full,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  previewsScroll: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  previewBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  previewTag: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
