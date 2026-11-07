import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export interface SpeechPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export class SpeechService {
  /**
   * Safely checks whether speech recognition is supported on the current hardware/environment.
   */
  static isSupported(): boolean {
    try {
      if (!ExpoSpeechRecognitionModule) return false;
      return ExpoSpeechRecognitionModule.isRecognitionAvailable?.() ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Requests speech recognition and microphone permissions from the operating system.
   */
  static async requestPermissions(): Promise<SpeechPermissionStatus> {
    try {
      if (!ExpoSpeechRecognitionModule) {
        return { granted: false, canAskAgain: false, status: 'unavailable' };
      }
      const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      return {
        granted: res.granted,
        canAskAgain: res.canAskAgain,
        status: res.status,
      };
    } catch {
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * Starts listening for spoken speech with Indian English/Hinglish language model.
   */
  static start(options?: { lang?: string }): void {
    const lang = options?.lang ?? 'en-IN';
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      continuous: false,
    });
  }

  /**
   * Stops listening and triggers final speech transcription result.
   */
  static stop(): void {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // safe fallback if not running
    }
  }

  /**
   * Aborts listening immediately without waiting for final result.
   */
  static abort(): void {
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // safe fallback
    }
  }
}
