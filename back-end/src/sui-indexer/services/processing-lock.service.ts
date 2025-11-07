import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ProcessingLockService {
  private readonly logger = new Logger(ProcessingLockService.name);
  private readonly locks = new Map<string, boolean>();
  private readonly lockTimestamps = new Map<string, number>();
  private readonly LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Try to acquire a lock for a given key
   * @param key Lock identifier (e.g., "marketplace::StorageListed")
   * @returns true if lock acquired, false if already locked
   */
  tryAcquireLock(key: string): boolean {
    this.cleanupExpiredLock(key);

    if (this.locks.get(key)) {
      this.logger.debug(`Lock already held for ${key}`);
      return false;
    }

    this.locks.set(key, true);
    this.lockTimestamps.set(key, Date.now());
    this.logger.debug(`Lock acquired for ${key}`);
    return true;
  }

  /**
   * Release a lock
   */
  releaseLock(key: string): void {
    this.locks.delete(key);
    this.lockTimestamps.delete(key);
    this.logger.debug(`Lock released for ${key}`);
  }

  /**
   * Check if a lock is held
   */
  isLocked(key: string): boolean {
    this.cleanupExpiredLock(key);
    return this.locks.get(key) || false;
  }

  /**
   * Clean up expired locks
   */
  private cleanupExpiredLock(key: string): void {
    const timestamp = this.lockTimestamps.get(key);
    if (timestamp && Date.now() - timestamp > this.LOCK_TIMEOUT_MS) {
      this.logger.warn(`Lock for ${key} has expired, releasing...`);
      this.releaseLock(key);
    }
  }

  /**
   * Get all active locks (for debugging)
   */
  getActiveLocks(): string[] {
    const active: string[] = [];
    for (const [key] of this.locks.entries()) {
      if (this.isLocked(key)) {
        active.push(key);
      }
    }
    return active;
  }

  /**
   * Force release all locks (use with caution)
   */
  releaseAllLocks(): void {
    this.locks.clear();
    this.lockTimestamps.clear();
    this.logger.warn('All locks forcefully released');
  }
}
