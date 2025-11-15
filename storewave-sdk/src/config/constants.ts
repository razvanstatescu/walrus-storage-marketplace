/**
 * Storage and currency constants for Walrus Storage Marketplace
 */

/**
 * Bytes per storage unit (1 MiB)
 * Walrus uses MiB as the base storage unit
 */
export const BYTES_PER_UNIT_SIZE = 1024 * 1024;

/**
 * WAL token decimals
 * 1 WAL = 1,000,000,000 FROST (smallest unit)
 */
export const WAL_DECIMALS = 9;

/**
 * FROST per WAL conversion factor
 */
export const FROST_PER_WAL = 10 ** WAL_DECIMALS;

/**
 * Unit multipliers for size conversions
 */
export const UNIT_MULTIPLIERS = {
  bytes: 1,
  KiB: 1024,
  MiB: 1024 * 1024,
  GiB: 1024 * 1024 * 1024,
  TiB: 1024 * 1024 * 1024 * 1024,
} as const;

/**
 * Default pagination limit
 */
export const DEFAULT_PAGINATION_LIMIT = 20;

/**
 * Maximum pagination limit
 */
export const MAX_PAGINATION_LIMIT = 100;
