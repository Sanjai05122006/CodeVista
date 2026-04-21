import crypto from "crypto";

class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private generateKey(code: string, language: string): string {
    return crypto
      .createHash("sha256")
      .update(`${code}:${language}`)
      .digest("hex");
  }

  private isExpired(entry: any): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  set<T>(key: string, value: T, ttlMinutes: number = 60): void {
    const ttl = ttlMinutes * 60 * 1000;
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  getExecutionCacheKey(code: string, language: string): string {
    return `exec:${this.generateKey(code, language)}`;
  }

  stats() {
    return { size: this.cache.size };
  }
}

export const cacheService = new CacheService();