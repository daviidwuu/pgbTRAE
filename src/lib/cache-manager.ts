/**
 * Cache Manager for PWA Instant Loading
 * 
 * Provides cache-first data loading strategy for instant UI display
 * Uses localStorage for small data and IndexedDB for larger datasets
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  version?: string; // Cache version for invalidation
  storage?: 'localStorage' | 'indexedDB';
}

class CacheManager {
  private static instance: CacheManager;
  private dbName = 'pgb-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  constructor() {
    this.initIndexedDB();
  }

  private async initIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('userData')) {
          db.createObjectStore('userData', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 5 * 60 * 1000, version = '1.0', storage = 'localStorage' } = options;
    
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      version
    };

    try {
      if (storage === 'localStorage') {
        localStorage.setItem(`pgb-cache-${key}`, JSON.stringify(cacheItem));
      } else {
        await this.setIndexedDB(key, cacheItem);
      }
    } catch (error) {
      console.warn(`Failed to cache ${key}:`, error);
    }
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { ttl = 5 * 60 * 1000, version = '1.0', storage = 'localStorage' } = options;

    try {
      let cacheItem: CacheItem<T> | null = null;

      if (storage === 'localStorage') {
        const cached = localStorage.getItem(`pgb-cache-${key}`);
        if (cached) {
          cacheItem = JSON.parse(cached);
        }
      } else {
        cacheItem = await this.getIndexedDB<T>(key);
      }

      if (!cacheItem) return null;

      // Check if cache is expired
      if (Date.now() - cacheItem.timestamp > ttl) {
        await this.delete(key, { storage });
        return null;
      }

      // Check version compatibility
      if (cacheItem.version !== version) {
        await this.delete(key, { storage });
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn(`Failed to get cached ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const { storage = 'localStorage' } = options;

    try {
      if (storage === 'localStorage') {
        localStorage.removeItem(`pgb-cache-${key}`);
      } else {
        await this.deleteIndexedDB(key);
      }
    } catch (error) {
      console.warn(`Failed to delete cached ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Clear localStorage cache
      const keys = Object.keys(localStorage).filter(key => key.startsWith('pgb-cache-'));
      keys.forEach(key => localStorage.removeItem(key));

      // Clear IndexedDB cache
      if (this.db) {
        const transaction = this.db.transaction(['transactions', 'budgets', 'userData'], 'readwrite');
        transaction.objectStore('transactions').clear();
        transaction.objectStore('budgets').clear();
        transaction.objectStore('userData').clear();
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  private async setIndexedDB<T>(key: string, data: CacheItem<T>): Promise<void> {
    if (!this.db) await this.initIndexedDB();
    if (!this.db) throw new Error('IndexedDB not available');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readwrite');
      const store = transaction.objectStore('userData');
      const request = store.put({ id: key, ...data });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getIndexedDB<T>(key: string): Promise<CacheItem<T> | null> {
    if (!this.db) await this.initIndexedDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readonly');
      const store = transaction.objectStore('userData');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { id, ...cacheItem } = result;
          resolve(cacheItem as CacheItem<T>);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readwrite');
      const store = transaction.objectStore('userData');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache user data for instant loading
   */
  async cacheUserData(userId: string, userData: any): Promise<void> {
    await this.set(`user-${userId}`, userData, {
      ttl: 10 * 60 * 1000, // 10 minutes
      storage: 'localStorage'
    });
  }

  /**
   * Get cached user data
   */
  async getCachedUserData(userId: string): Promise<any | null> {
    return this.get(`user-${userId}`, {
      ttl: 10 * 60 * 1000,
      storage: 'localStorage'
    });
  }

  /**
   * Cache transactions for instant loading
   */
  async cacheTransactions(userId: string, transactions: any[]): Promise<void> {
    await this.set(`transactions-${userId}`, transactions, {
      ttl: 5 * 60 * 1000, // 5 minutes
      storage: 'indexedDB'
    });
  }

  /**
   * Get cached transactions
   */
  async getCachedTransactions(userId: string): Promise<any[] | null> {
    return this.get(`transactions-${userId}`, {
      ttl: 5 * 60 * 1000,
      storage: 'indexedDB'
    });
  }

  /**
   * Cache budgets for instant loading
   */
  async cacheBudgets(userId: string, budgets: any[]): Promise<void> {
    await this.set(`budgets-${userId}`, budgets, {
      ttl: 10 * 60 * 1000, // 10 minutes
      storage: 'localStorage'
    });
  }

  /**
   * Get cached budgets
   */
  async getCachedBudgets(userId: string): Promise<any[] | null> {
    return this.get(`budgets-${userId}`, {
      ttl: 10 * 60 * 1000,
      storage: 'localStorage'
    });
  }
}

export const cacheManager = CacheManager.getInstance();