// iOS Haptic Feedback implementation
export class IOSHapticFeedback {
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'vibrate' in navigator && /iPad|iPhone|iPod/.test(navigator.userAgent);
    console.log('[iOS Haptic] Haptic feedback support:', this.isSupported);
  }

  // Light haptic feedback
  light(): void {
    if (!this.isSupported) return;
    navigator.vibrate(10);
  }

  // Medium haptic feedback
  medium(): void {
    if (!this.isSupported) return;
    navigator.vibrate(20);
  }

  // Heavy haptic feedback
  heavy(): void {
    if (!this.isSupported) return;
    navigator.vibrate(50);
  }

  // Success haptic pattern
  success(): void {
    if (!this.isSupported) return;
    navigator.vibrate([10, 50, 10]);
  }

  // Error haptic pattern
  error(): void {
    if (!this.isSupported) return;
    navigator.vibrate([50, 100, 50, 100, 50]);
  }

  // Warning haptic pattern
  warning(): void {
    if (!this.isSupported) return;
    navigator.vibrate([30, 50, 30]);
  }

  // Custom haptic pattern
  custom(pattern: number[]): void {
    if (!this.isSupported) return;
    navigator.vibrate(pattern);
  }
}