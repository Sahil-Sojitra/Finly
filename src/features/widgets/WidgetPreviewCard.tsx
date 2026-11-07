import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SmallWidgetLayout } from './SmallWidgetLayout';
import { MediumWidgetLayout } from './MediumWidgetLayout';
import { WidgetService } from '@/services/widgetService';
import { WidgetSnapshotData, WidgetSnapshotSerializer } from '@/domain/widgetSnapshot';
import { radii, shadows, spacing, typography, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export function WidgetPreviewCard() {
  const { colors, isDark } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="apps-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Home Screen Widgets</Text>
        </View>

        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: colors.primaryLight }]}
          onPress={handleSyncNow}
          disabled={isSyncing}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={14} color={colors.primary} />
          <Text style={[styles.syncButtonText, { color: isDark ? '#93C5FD' : colors.primaryDark }]}>{isSyncing ? 'Syncing...' : 'Sync Widgets'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Finly supports native Android AppWidgets and iOS WidgetKit. Widgets display live snapshots of your active salary cycle balance and spending.
      </Text>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.surfaceSecondary }]}>
        {(['both', 'small', 'medium'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && [styles.tabButtonActive, { backgroundColor: colors.surface }]]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.textPrimary : colors.textSecondary }]}>
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
          <View style={[styles.previewBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.previewTag, { color: colors.textSecondary }]}>Small Widget (2x2)</Text>
            <SmallWidgetLayout data={snapshot} />
          </View>
        )}

        {(activeTab === 'both' || activeTab === 'medium') && (
          <View style={[styles.previewBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.previewTag, { color: colors.textSecondary }]}>Medium Widget (4x2)</Text>
            <MediumWidgetLayout data={snapshot} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
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
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
    gap: 4,
  },
  syncButtonText: {
    ...typography.caption,
    fontWeight: '700',
  },
  description: {
    ...typography.bodyMedium,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  tabRow: {
    flexDirection: 'row',
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
    ...shadows.sm,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
  },
  previewsScroll: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  previewBox: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  previewTag: {
    ...typography.caption,
    fontWeight: '700',
  },
});
