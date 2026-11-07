import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme';

// Prevent splash screen from auto-hiding before initialization completes
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen might already be hidden or unavailable in some environments
});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after root layout mounts
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction/new"
          options={{
            title: 'Add Transaction',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="transaction/[id]"
          options={{
            title: 'Transaction Details',
          }}
        />
        <Stack.Screen
          name="salary/new"
          options={{
            title: 'New Salary Cycle',
            presentation: 'modal',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
