import type { ClientWithCoreApi } from '@mysten/sui/experimental';
import { createWalrusClient } from '@/lib/config/walrus';

export interface StorageCostParams {
  size: number;
  epochs: number;
}

export interface StorageCostResult {
  storageCost: bigint;
}

/**
 * Calculate the storage cost for storing data in Walrus
 *
 * @param suiClient - The Sui client instance
 * @param params - Storage cost parameters
 * @param params.size - Size of the data in bytes
 * @param params.epochs - Number of epochs to store the data
 * @returns Promise resolving to the storage cost
 * @throws Error if the calculation fails
 */
export async function calculateStorageCost(
  suiClient: ClientWithCoreApi,
  params: StorageCostParams
): Promise<StorageCostResult> {
  try {
    const walrusClient = createWalrusClient(suiClient);
    const result = await walrusClient.walrus.storageCost(params.size, params.epochs);

    // Return only the storageCost property as requested
    return {
      storageCost: result.storageCost,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error calculating storage cost';
    throw new Error(`Failed to calculate storage cost: ${errorMessage}`);
  }
}
