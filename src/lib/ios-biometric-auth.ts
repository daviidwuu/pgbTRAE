// iOS Biometric Authentication using WebAuthn
export class IOSBiometricAuth {
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'credentials' in navigator && 
                      'create' in navigator.credentials &&
                      /iPad|iPhone|iPod/.test(navigator.userAgent);
    console.log('[iOS Biometric] Biometric authentication support:', this.isSupported);
  }

  // Register biometric authentication
  async registerBiometric(userId: string): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[iOS Biometric] Biometric authentication not supported');
      return false;
    }

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: 'PiggyBank',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: 'PiggyBank User',
          },
          pubKeyCredParams: [{
            type: 'public-key',
            alg: -7, // ES256
          }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'direct',
        },
      }) as PublicKeyCredential;

      if (credential) {
        // Store credential ID for future authentication
        localStorage.setItem('biometric-credential-id', credential.id);
        console.log('[iOS Biometric] Biometric registration successful');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[iOS Biometric] Biometric registration failed:', error);
      return false;
    }
  }

  // Authenticate using biometrics
  async authenticateBiometric(): Promise<boolean> {
    if (!this.isSupported) return false;

    const credentialId = localStorage.getItem('biometric-credential-id');
    if (!credentialId) {
      console.warn('[iOS Biometric] No biometric credential registered');
      return false;
    }

    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            type: 'public-key',
            id: new TextEncoder().encode(credentialId),
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (credential) {
        console.log('[iOS Biometric] Biometric authentication successful');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[iOS Biometric] Biometric authentication failed:', error);
      return false;
    }
  }

  // Check if biometric is registered
  isBiometricRegistered(): boolean {
    return !!localStorage.getItem('biometric-credential-id');
  }

  // Remove biometric registration
  removeBiometric(): void {
    localStorage.removeItem('biometric-credential-id');
    console.log('[iOS Biometric] Biometric registration removed');
  }
}