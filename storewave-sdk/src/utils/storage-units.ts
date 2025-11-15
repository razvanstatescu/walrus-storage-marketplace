/**
 * Storage unit conversion utilities
 */

import { BYTES_PER_UNIT_SIZE, FROST_PER_WAL, UNIT_MULTIPLIERS } from '../config/constants.js';
import type { SizeUnit } from '../types/index.js';

/**
 * Convert size from any unit to bytes
 *
 * @param size - Size value
 * @param unit - Unit of the size
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * convertToBytes(5, 'GiB') // Returns 5368709120 (5 * 1024^3)
 * convertToBytes(100, 'MiB') // Returns 104857600 (100 * 1024^2)
 * ```
 */
export function convertToBytes(size: number, unit: SizeUnit = 'bytes'): number {
  return Math.floor(size * UNIT_MULTIPLIERS[unit]);
}

/**
 * Convert bytes to storage units (MiB)
 * Uses ceiling to ensure sufficient storage is allocated
 *
 * @param bytes - Size in bytes
 * @returns Storage units (MiB), rounded up
 *
 * @example
 * ```typescript
 * convertToStorageUnits(1500000) // Returns 2 (ceil(1.43 MiB))
 * convertToStorageUnits(1048576) // Returns 1 (exactly 1 MiB)
 * ```
 */
export function convertToStorageUnits(bytes: number): number {
  return Math.ceil(bytes / BYTES_PER_UNIT_SIZE);
}

/**
 * Format bytes to human-readable size string
 *
 * @param bytes - Size in bytes
 * @returns Formatted string with appropriate unit
 *
 * @example
 * ```typescript
 * formatStorageSize(1500000n) // Returns "1.43 MiB (2 storage units)"
 * formatStorageSize(5368709120n) // Returns "5.00 GiB (5120 storage units)"
 * ```
 */
export function formatStorageSize(bytes: bigint): string {
  const bytesNum = Number(bytes);
  const units = convertToStorageUnits(bytesNum);

  const mib = bytesNum / BYTES_PER_UNIT_SIZE;
  const gib = mib / 1024;
  const tib = gib / 1024;

  if (tib >= 1) {
    return `${tib.toFixed(2)} TiB (${units.toLocaleString()} storage units)`;
  }
  if (gib >= 1) {
    return `${gib.toFixed(2)} GiB (${units.toLocaleString()} storage units)`;
  }
  return `${mib.toFixed(2)} MiB (${units.toLocaleString()} storage units)`;
}

/**
 * Convert FROST to WAL
 *
 * @param frost - Amount in FROST (smallest unit)
 * @returns Amount in WAL
 *
 * @example
 * ```typescript
 * frostToWal(1000000000n) // Returns 1 (1 WAL)
 * frostToWal(500000000n) // Returns 0.5 (0.5 WAL)
 * ```
 */
export function frostToWal(frost: bigint | number): number {
  const frostNum = typeof frost === 'bigint' ? Number(frost) : frost;
  return frostNum / FROST_PER_WAL;
}

/**
 * Convert WAL to FROST
 *
 * @param wal - Amount in WAL
 * @returns Amount in FROST (smallest unit)
 *
 * @example
 * ```typescript
 * walToFrost(1) // Returns 1000000000n (1 WAL in FROST)
 * walToFrost(0.5) // Returns 500000000n (0.5 WAL in FROST)
 * ```
 */
export function walToFrost(wal: number): bigint {
  return BigInt(Math.floor(wal * FROST_PER_WAL));
}

/**
 * Format FROST amount to WAL string for display
 *
 * @param frost - Amount in FROST
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted WAL amount string
 *
 * @example
 * ```typescript
 * formatWalPrice(1500000000n) // Returns "1.5000"
 * formatWalPrice(1500000000n, 2) // Returns "1.50"
 * ```
 */
export function formatWalPrice(frost: bigint | number, decimals: number = 4): string {
  const walAmount = frostToWal(frost);
  return walAmount.toFixed(decimals);
}
