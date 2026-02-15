import { Locale } from '@/contexts/TranslationContext';

interface CacheEntry {
  value: string;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheMetadata {
  size: number;
  maxSize: number;
  lastCleanup: number;
}

export class TranslationCache {
  private memoryCache: Map<string, CacheEntry>;
  private storageKey: string;
  private storageType: 'localStorage' | 'sessionStorage';
  private maxSize: number;
  private defaultTTL: number;

  constructor(storageType: 'localStorage' | 'sessionStorage' = 'sessionStorage') {
    this.memoryCache = new Map();
    this.storageKey = 'translations';
    this.storageType = storageType;
    this.maxSize = 1000;
    this.defaultTTL = 3600000; // 1 hour in milliseconds

    // Load from storage on initialization
    this.loadFromStorage();
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(locale: Locale, entityType: string, entityId: string, field: string): string {
    return `${locale}:${entityType}:${entityId}:${field}`;
  }

  /**
   * Get translation from cache
   */
  get(locale: Locale, entityType: string, entityId: string, field: string): string | null {
    const key = this.generateKey(locale, entityType, entityId, field);
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.persistToStorage();
      return null;
    }

    // Update access metadata for LRU
    entry.accessCount++;
    entry.lastAccessed = now;
    this.memoryCache.set(key, entry);

    return entry.value;
  }

  /**
   * Set translation in cache
   */
  set(
    locale: Locale,
    entityType: string,
    entityId: string,
    field: string,
    value: string,
    ttl?: number
  ): void {
    const key = this.generateKey(locale, entityType, entityId, field);
    const now = Date.now();

    const entry: CacheEntry = {
      value,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 1,
      lastAccessed: now,
    };

    // Check if cache is full and evict LRU entry
    if (this.memoryCache.size >= this.maxSize && !this.memoryCache.has(key)) {
      this.evictLRU();
    }

    this.memoryCache.set(key, entry);
    this.persistToStorage();
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.clearStorage();
  }

  /**
   * Clear cache for specific locale
   */
  clearLocale(locale: Locale): void {
    const keysToDelete: string[] = [];

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(`${locale}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
    this.persistToStorage();
  }

  /**
   * Evict least recently used entry (LRU)
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.memoryCache.delete(lruKey);
    }
  }

  /**
   * Load cache from storage
   */
  private loadFromStorage(): void {
    try {
      const storage = this.getStorage();
      if (!storage) return;

      const data = storage.getItem(this.storageKey);
      if (!data) return;

      const parsed = JSON.parse(data);
      if (parsed.translations) {
        Object.entries(parsed.translations).forEach(([key, entry]) => {
          this.memoryCache.set(key, entry as CacheEntry);
        });
      }
    } catch (error) {
      console.error('Failed to load translation cache from storage:', error);
      // Clear corrupted cache
      this.clearStorage();
    }
  }

  /**
   * Persist cache to storage
   */
  private persistToStorage(): void {
    try {
      const storage = this.getStorage();
      if (!storage) return;

      const translations: Record<string, CacheEntry> = {};
      this.memoryCache.forEach((entry, key) => {
        translations[key] = entry;
      });

      const metadata: CacheMetadata = {
        size: this.memoryCache.size,
        maxSize: this.maxSize,
        lastCleanup: Date.now(),
      };

      const data = {
        translations,
        metadata,
      };

      storage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, clearing old entries');
        this.clearOldEntries();
        // Try again after clearing
        try {
          const storage = this.getStorage();
          if (storage) {
            const translations: Record<string, CacheEntry> = {};
            this.memoryCache.forEach((entry, key) => {
              translations[key] = entry;
            });
            storage.setItem(this.storageKey, JSON.stringify({ translations }));
          }
        } catch (retryError) {
          console.error('Failed to persist cache after cleanup:', retryError);
        }
      } else {
        console.error('Failed to persist translation cache:', error);
      }
    }
  }

  /**
   * Clear storage
   */
  private clearStorage(): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Clear old entries (older than 24 hours)
   */
  private clearOldEntries(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }

  /**
   * Get storage object
   */
  private getStorage(): Storage | null {
    try {
      if (typeof window === 'undefined') return null;
      return this.storageType === 'localStorage' ? localStorage : sessionStorage;
    } catch (error) {
      // Storage not available (e.g., private browsing)
      console.warn('Storage not available:', error);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.memoryCache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        accessCount: entry.accessCount,
      })),
    };
  }
}

// Singleton instance
let cacheInstance: TranslationCache | null = null;

export function getTranslationCache(): TranslationCache {
  if (!cacheInstance) {
    cacheInstance = new TranslationCache('sessionStorage');
  }
  return cacheInstance;
}
