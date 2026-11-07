import * as SecureStore from 'expo-secure-store';

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
}

const SECURE_TOKEN_KEY = 'finly_google_access_token';
const SECURE_USER_KEY = 'finly_google_user_profile';
const SECURE_PASSPHRASE_KEY = 'finly_local_recovery_passphrase';

export class GoogleAuthService {
  /**
   * Minimum necessary OAuth scope for Finly backups.
   * Gives access ONLY to the hidden appDataFolder in Google Drive.
   */
  static readonly SCOPE_DRIVE_APPDATA = 'https://www.googleapis.com/auth/drive.appdata';

  /**
   * Retrieves Google OAuth Client IDs from environment or defaults.
   */
  static getClientIds() {
    return {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    };
  }

  /**
   * Returns whether valid Google OAuth Client IDs are configured.
   */
  static isConfigured(): boolean {
    const { webClientId, iosClientId, androidClientId } = this.getClientIds();
    return Boolean(webClientId || iosClientId || androidClientId);
  }

  /**
   * Checks if user currently has a valid session token.
   */
  static async isSignedIn(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
      return Boolean(token && token.trim().length > 0);
    } catch {
      return false;
    }
  }

  /**
   * Retrieves the current access token.
   * Sensitive invariant: never log or expose token.
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Saves access token and user profile securely.
   */
  static async saveSession(accessToken: string, user: GoogleUserProfile): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(SECURE_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(user)),
    ]);
  }

  /**
   * Retrieves the cached user profile.
   */
  static async getUserProfile(): Promise<GoogleUserProfile | null> {
    try {
      const raw = await SecureStore.getItemAsync(SECURE_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as GoogleUserProfile;
    } catch {
      return null;
    }
  }

  /**
   * Disconnects the Google account and clears all tokens from SecureStore.
   */
  static async signOut(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_TOKEN_KEY),
        SecureStore.deleteItemAsync(SECURE_USER_KEY),
      ]);
    } catch {
      // Ignore deletion errors
    }
  }

  /**
   * Saves user's recovery passphrase to local device SecureStore for automated backups.
   * Protected on device by biometric/hardware keychain.
   */
  static async saveRecoveryPassphraseLocally(passphrase: string): Promise<void> {
    await SecureStore.setItemAsync(SECURE_PASSPHRASE_KEY, passphrase);
  }

  /**
   * Retrieves locally cached recovery passphrase, if saved.
   */
  static async getLocalRecoveryPassphrase(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_PASSPHRASE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Clears locally cached recovery passphrase.
   */
  static async clearLocalRecoveryPassphrase(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_PASSPHRASE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Mock/Demo sign in for offline testing, simulators, or environments without live GCP credentials.
   */
  static async simulateSignIn(email = 'user@finly-privacy.app', name = 'Finly User'): Promise<GoogleUserProfile> {
    const profile: GoogleUserProfile = { email, name };
    await this.saveSession('simulated_mock_google_oauth_token_' + Date.now(), profile);
    return profile;
  }
}
