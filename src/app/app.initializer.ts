import { EncryptionService } from './services/encryption.service';

export function initializeApp(encryptionService: EncryptionService) {
  return (): Promise<any> => {
    return new Promise((resolve, reject) => {
      encryptionService.loadSettings().subscribe({
        next: () => {
          console.log('App initialized: Encryption settings loaded');
          resolve(true);
        },
        error: (error) => {
          console.error('App initialization failed:', error);
          reject(error);
        }
      });
    });
  };
}
