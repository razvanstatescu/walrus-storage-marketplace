/**
 * Input validation utilities
 */

import { ValidationError } from '../types/index.js';
import type { SizeUnit } from '../types/index.js';

/**
 * Validate size unit
 */
export function validateSizeUnit(unit: string): asserts unit is SizeUnit {
  const validUnits: SizeUnit[] = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (!validUnits.includes(unit as SizeUnit)) {
    throw new ValidationError(
      `Invalid size unit "${unit}". Must be one of: ${validUnits.join(', ')}`,
    );
  }
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number, got: ${value}`);
  }
}

/**
 * Validate positive integer
 */
export function validatePositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer, got: ${value}`);
  }
}

/**
 * Validate Sui address format
 */
export function validateSuiAddress(address: string, fieldName: string = 'address'): void {
  if (!address || typeof address !== 'string') {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }

  if (!address.startsWith('0x')) {
    throw new ValidationError(`${fieldName} must start with "0x"`);
  }

  // Sui addresses should be 66 characters (0x + 64 hex chars) after normalization
  // But we'll accept various lengths since they can be shortened
  if (address.length < 3) {
    throw new ValidationError(`${fieldName} is too short`);
  }

  const hexPart = address.slice(2);
  if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
    throw new ValidationError(`${fieldName} contains invalid characters`);
  }
}

/**
 * Validate array of object IDs
 */
export function validateObjectIds(ids: string[], fieldName: string): void {
  if (!Array.isArray(ids)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }

  if (ids.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }

  ids.forEach((id, index) => {
    validateSuiAddress(id, `${fieldName}[${index}]`);
  });
}

/**
 * Validate pagination limit
 */
export function validatePaginationLimit(limit: number | undefined, max: number): void {
  if (limit !== undefined) {
    validatePositiveInteger(limit, 'limit');
    if (limit > max) {
      throw new ValidationError(`limit cannot exceed ${max}`);
    }
  }
}

/**
 * Validate prices array matches object IDs array length
 */
export function validatePricesMatchObjects(
  objectIds: string[],
  prices: number[],
): void {
  if (!Array.isArray(prices)) {
    throw new ValidationError('prices must be an array');
  }

  if (objectIds.length !== prices.length) {
    throw new ValidationError(
      `Number of prices (${prices.length}) must match number of objects (${objectIds.length})`,
    );
  }

  prices.forEach((price, index) => {
    validatePositiveNumber(price, `prices[${index}]`);
  });
}
