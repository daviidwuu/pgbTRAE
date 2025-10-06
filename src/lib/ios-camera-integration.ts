// iOS Camera Integration
export class IOSCameraIntegration {
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'mediaDevices' in navigator && 
                      'getUserMedia' in navigator.mediaDevices &&
                      /iPad|iPhone|iPod/.test(navigator.userAgent);
    console.log('[iOS Camera] Camera integration support:', this.isSupported);
  }

  // Capture photo from camera
  async capturePhoto(): Promise<Blob | null> {
    if (!this.isSupported) {
      console.warn('[iOS Camera] Camera not supported');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      return new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            
            canvas.toBlob((blob) => {
              // Stop camera stream
              stream.getTracks().forEach(track => track.stop());
              resolve(blob);
            }, 'image/jpeg', 0.8);
          } else {
            stream.getTracks().forEach(track => track.stop());
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('[iOS Camera] Failed to capture photo:', error);
      return null;
    }
  }

  // Open camera for receipt scanning
  async scanReceipt(): Promise<string | null> {
    const photoBlob = await this.capturePhoto();
    if (!photoBlob) return null;

    // Here you would integrate with OCR service
    // For now, return a placeholder
    console.log('[iOS Camera] Receipt captured, would process with OCR');
    return 'Receipt data would be extracted here';
  }
}