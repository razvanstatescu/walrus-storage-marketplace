/**
 * Storage price calculation utilities
 */

const BYTES_PER_UNIT_SIZE = 1024 * 1024; // 1 MiB

/**
 * Calculate storage units from size in bytes
 * Uses the same calculation as Walrus SDK
 *
 * @param size - Size in bytes
 * @returns Number of storage units (MiB)
 */
export function storageUnitsFromSize(size: bigint | number): number {
  const sizeNumber = typeof size === 'bigint' ? Number(size) : size;
  return Math.ceil(sizeNumber / BYTES_PER_UNIT_SIZE);
}

/**
 * Calculate duration in epochs
 *
 * @param startEpoch - Start epoch
 * @param endEpoch - End epoch
 * @returns Duration in epochs
 */
export function calculateItemDuration(
  startEpoch: number,
  endEpoch: number
): number {
  return endEpoch - startEpoch;
}

/**
 * Calculate price for a single item
 *
 * @param storageSize - Storage size in bytes
 * @param startEpoch - Start epoch
 * @param endEpoch - End epoch
 * @param pricePerMiBPerEpoch - Price per MiB per epoch in WAL
 * @returns Total price in WAL
 */
export function calculateItemPrice(
  storageSize: bigint | number,
  startEpoch: number,
  endEpoch: number,
  pricePerMiBPerEpoch: number
): number {
  const units = storageUnitsFromSize(storageSize);
  const duration = calculateItemDuration(startEpoch, endEpoch);
  return units * duration * pricePerMiBPerEpoch;
}

/**
 * Calculate total price for multiple items
 *
 * @param items - Array of items with storageSize, startEpoch, endEpoch
 * @param pricePerMiBPerEpoch - Price per MiB per epoch in WAL
 * @returns Total price in WAL
 */
export function calculateTotalPrice(
  items: Array<{
    storageSize: bigint | number;
    startEpoch: number;
    endEpoch: number;
  }>,
  pricePerMiBPerEpoch: number
): number {
  return items.reduce((sum, item) => {
    return sum + calculateItemPrice(
      item.storageSize,
      item.startEpoch,
      item.endEpoch,
      pricePerMiBPerEpoch
    );
  }, 0);
}

/**
 * Calculate total storage units for multiple items
 *
 * @param items - Array of items with storageSize
 * @returns Total storage units in MiB
 */
export function calculateTotalUnits(
  items: Array<{ storageSize: bigint | number }>
): number {
  return items.reduce((sum, item) => {
    return sum + storageUnitsFromSize(item.storageSize);
  }, 0);
}

/**
 * Format WAL price for display
 * Converts from FROST to WAL (1 WAL = 1,000,000,000 FROST)
 *
 * @param price - Price in FROST (smallest unit)
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted price string in WAL
 */
export function formatWalPrice(
  price: bigint | number,
  decimals: number = 4
): string {
  const priceNumber = typeof price === 'bigint' ? Number(price) : price;

  // Convert from FROST to WAL
  // Conversion rate: 1 WAL = 1,000,000,000 FROST
  const walAmount = priceNumber / 1_000_000_000;

  return walAmount.toFixed(decimals);
}

/**
 * Format price as simple number with decimals
 *
 * @param price - Price as number
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted price string
 */
export function formatPrice(price: number, decimals: number = 4): string {
  return price.toFixed(decimals);
}
