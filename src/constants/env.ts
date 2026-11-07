/**
 * Environment configuration loader
 * Safely parses and exposes environment variables without committing secrets
 */

export interface AppConfig {
  env: 'development' | 'staging' | 'production';
  appName: string;
  defaultCurrency: string;
  defaultLocale: string;
  isDev: boolean;
}

export const env: AppConfig = {
  env: (process.env.EXPO_PUBLIC_APP_ENV as AppConfig['env']) || 'development',
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'Finly',
  defaultCurrency: process.env.EXPO_PUBLIC_DEFAULT_CURRENCY || 'INR',
  defaultLocale: process.env.EXPO_PUBLIC_DEFAULT_LOCALE || 'en-IN',
  isDev: (process.env.EXPO_PUBLIC_APP_ENV || 'development') === 'development',
};

