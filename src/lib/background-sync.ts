// Background sync for offline transaction handling
export interface PendingTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  userId: string;
  timestamp: number;
  retryCount: number;
}

export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private readonly STORAGE_KEY = 'pending-transactions';
  private readonly MAX_RETRIES = 3;

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  // Queue transaction for background sync
  async queueTransaction(transaction: Omit<PendingTransaction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const pendingTransaction: PendingTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    const pendingTransactions = this.getPendingTransactions();
    pendingTransactions.push(pendingTransaction);
    this.savePendingTransactions(pendingTransactions);

    // Try to sync immediately if online
    if (navigator.onLine) {
      await this.syncPendingTransactions();
    } else {
      // Register for background sync when back online
      this.registerBackgroundSync();
    }

    console.log('[Background Sync] Transaction queued:', pendingTransaction.id);
  }

  // Get pending transactions from localStorage
  private getPendingTransactions(): PendingTransaction[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Background Sync] Error reading pending transactions:', error);
      return [];
    }
  }

  // Save pending transactions to localStorage
  private savePendingTransactions(transactions: PendingTransaction[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('[Background Sync] Error saving pending transactions:', error);
    }
  }

  // Sync all pending transactions
  async syncPendingTransactions(): Promise<void> {
    const pendingTransactions = this.getPendingTransactions();
    if (pendingTransactions.length === 0) return;

    console.log(`[Background Sync] Syncing ${pendingTransactions.length} pending transactions`);

    const successfulSyncs: string[] = [];
    const failedSyncs: PendingTransaction[] = [];

    for (const transaction of pendingTransactions) {
      try {
        await this.syncTransaction(transaction);
        successfulSyncs.push(transaction.id);
        console.log('[Background Sync] Transaction synced successfully:', transaction.id);
      } catch (error) {
        console.error('[Background Sync] Failed to sync transaction:', transaction.id, error);
        
        // Increment retry count
        transaction.retryCount++;
        
        // Only retry if under max retries
        if (transaction.retryCount < this.MAX_RETRIES) {
          failedSyncs.push(transaction);
        } else {
          console.warn('[Background Sync] Max retries reached for transaction:', transaction.id);
          // Optionally, move to a failed transactions store or notify user
        }
      }
    }

    // Update pending transactions (remove successful, keep failed for retry)
    this.savePendingTransactions(failedSyncs);

    // Notify about sync results
    this.notifySyncResults(successfulSyncs.length, failedSyncs.length);
  }

  // Sync individual transaction
  private async syncTransaction(transaction: PendingTransaction): Promise<void> {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date,
        userId: transaction.userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Register for background sync
  private registerBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Type assertion for background sync API
        return (registration as any).sync.register('background-sync-transactions');
      }).catch((error) => {
        console.error('[Background Sync] Failed to register background sync:', error);
      });
    }
  }

  // Notify about sync results
  private notifySyncResults(successful: number, failed: number): void {
    if (successful > 0) {
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Transactions Synced', {
          body: `${successful} transaction(s) synced successfully`,
          icon: '/icon.png',
          tag: 'sync-success',
        });
      }
    }

    if (failed > 0) {
      console.warn(`[Background Sync] ${failed} transactions failed to sync`);
    }
  }

  // Get count of pending transactions
  getPendingCount(): number {
    return this.getPendingTransactions().length;
  }

  // Clear all pending transactions (for testing/debugging)
  clearPendingTransactions(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[Background Sync] Cleared all pending transactions');
  }

  // Initialize background sync
  init(): void {
    // Listen for online events to sync pending transactions
    window.addEventListener('online', () => {
      console.log('[Background Sync] Back online, syncing pending transactions');
      this.syncPendingTransactions();
    });

    // Sync on page load if online
    if (navigator.onLine) {
      this.syncPendingTransactions();
    }

    console.log('[Background Sync] Initialized');
  }
}

// Export singleton instance
export const backgroundSyncManager = BackgroundSyncManager.getInstance();