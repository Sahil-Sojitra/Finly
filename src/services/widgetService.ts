import { Widget } from 'expo-widgets';
import { WidgetSnapshotData, WidgetSnapshotSerializer } from '@/domain/widgetSnapshot';
import { SalaryCycleRepository } from '@/database/repositories/salaryCycleRepository';
import { TransactionRepository } from '@/database/repositories/transactionRepository';
import { SettingsRepository } from '@/database/repositories/settingsRepository';
import { SalaryCycleEngine } from '@/domain/salaryCycleEngine';

const SNAPSHOT_SETTINGS_KEY = 'widget_snapshot_v1';

export class WidgetService {
  private static widgetInstance: Widget<WidgetSnapshotData> | null = null;
  private static cycleRepo = new SalaryCycleRepository();
  private static txRepo = new TransactionRepository();
  private static settingsRepo = new SettingsRepository();

  /**
   * Returns or initializes the native widget bridge instance.
   */
  static getWidgetInstance(): Widget<WidgetSnapshotData> {
    if (!this.widgetInstance) {
      this.widgetInstance = new Widget<WidgetSnapshotData>(
        'FinlyWidget',
        // Layout renderer stub (native layouts are rendered in WidgetLayout components)
        (_props: WidgetSnapshotData) => {
          // Fallback basic element for web/stubs
          return null as unknown as React.JSX.Element;
        },
        WidgetSnapshotSerializer.createFallbackSnapshot()
      );
    }
    return this.widgetInstance;
  }

  /**
   * Synchronizes latest SQLite financial records to the native widget snapshot.
   * Call after any transaction mutation, salary cycle mutation, or backup restore.
   */
  static async syncFromDatabase(): Promise<WidgetSnapshotData> {
    try {
      const cycles = await this.cycleRepo.getAll();
      const transactions = await this.txRepo.getAll();
      const evaluation = SalaryCycleEngine.evaluateAll(cycles, transactions);

      const snapshot = WidgetSnapshotSerializer.createSnapshot({
        cycles,
        transactions,
        evaluation,
      });

      await this.pushSnapshot(snapshot);
      return snapshot;
    } catch (err) {
      console.warn('Failed to sync widget from database:', err);
      const fallback = WidgetSnapshotSerializer.createFallbackSnapshot();
      await this.pushSnapshot(fallback);
      return fallback;
    }
  }

  /**
   * Pushes snapshot data to both SQLite settings cache and native widget runtime.
   */
  static async pushSnapshot(snapshot: WidgetSnapshotData): Promise<void> {
    try {
      // 1. Cache to persistent settings for recovery and backup
      await this.settingsRepo.set(SNAPSHOT_SETTINGS_KEY, JSON.stringify(snapshot));

      // 2. Push to native widget bridge
      const widget = this.getWidgetInstance();
      widget.updateSnapshot(snapshot);
      widget.reload();
    } catch (err) {
      // On web or environments where native widget module is absent, safely catch
      console.warn('Widget snapshot push notice:', err);
    }
  }

  /**
   * Retrieves the last cached snapshot from settings.
   */
  static async getCachedSnapshot(): Promise<WidgetSnapshotData | null> {
    try {
      const raw = await this.settingsRepo.get(SNAPSHOT_SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as WidgetSnapshotData;
    } catch {
      return null;
    }
  }
}
