import { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, shadows, spacing, useTheme, ThemeColors } from '@/theme';
import { GoogleUserProfile } from '@/services';

interface GoogleConnectCardProps {
  isSignedIn: boolean;
  userProfile: GoogleUserProfile | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading?: boolean;
}

export function GoogleConnectCard({
  isSignedIn,
  userProfile,
  onConnect,
  onDisconnect,
  isLoading,
}: GoogleConnectCardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="logo-google" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.cardTitle}>Google Drive Sync</Text>
          <Text style={styles.cardSubtitle}>
            {isSignedIn ? 'Connected to hidden appDataFolder' : 'Connect account for cloud backups'}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            isSignedIn ? styles.statusPillConnected : styles.statusPillDisconnected,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isSignedIn ? styles.statusDotConnected : styles.statusDotDisconnected,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              isSignedIn ? styles.statusTextConnected : styles.statusTextDisconnected,
            ]}
          >
            {isSignedIn ? 'Active' : 'Offline'}
          </Text>
        </View>
      </View>

      {isSignedIn && userProfile ? (
        <View style={styles.profileSection}>
          <View style={styles.accountRow}>
            <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.accountEmail}>{userProfile.email}</Text>
          </View>
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            <Text style={styles.securityText}>
              Encrypted appDataFolder (invisible to other apps)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={onDisconnect}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.danger} />
            <Text style={styles.disconnectButtonText}>Disconnect Account</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.connectSection}>
          <Text style={styles.explanationText}>
            Finly uploads encrypted backups exclusively to Google Drive&apos;s private{' '}
            <Text style={styles.boldText}>appDataFolder</Text>. Neither Google nor other apps can
            read your financial data.
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={onConnect}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                <Text style={styles.connectButtonText}>Connect Google Drive</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...shadows.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? colors.surfaceSecondary : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    headerTextCol: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusPillConnected: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
    },
    statusPillDisconnected: {
      backgroundColor: colors.surfaceSecondary,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
    statusDotConnected: {
      backgroundColor: colors.success,
    },
    statusDotDisconnected: {
      backgroundColor: colors.textTertiary,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    statusTextConnected: {
      color: colors.success,
    },
    statusTextDisconnected: {
      color: colors.textSecondary,
    },
    profileSection: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: spacing.md,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    accountEmail: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    securityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.md,
    },
    securityText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    disconnectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: radii.md,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? colors.danger : '#FCA5A5',
      gap: 6,
    },
    disconnectButtonText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '600',
    },
    connectSection: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: spacing.md,
    },
    explanationText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    boldText: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    connectButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: radii.md,
      gap: 8,
      ...shadows.sm,
    },
    connectButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
