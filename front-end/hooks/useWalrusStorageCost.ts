"use client";

import { useState, useCallback } from "react";
import { useStorewaveSDK } from "./useStorewaveSDK";
import type {
  StorageCostParams,
  StorageCostResult,
  StorageCostState,
} from "@/types/storage";

/**
 * React hook for calculating Walrus storage costs
 * Now uses SDK which provides both optimized (marketplace + system) and system-only costs
 *
 * @returns Object containing the calculation function, loading state, error state, and result
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { calculateCost, isLoading, error, result } = useWalrusStorageCost();
 *
 *   const handleCalculate = async () => {
 *     try {
 *       const cost = await calculateCost({
 *         size: 1024 * 1024, // 1MB
 *         epochs: 30
 *       });
 *       console.log('Storage cost:', cost.storageCost);
 *     } catch (err) {
 *       console.error('Failed to calculate cost:', err);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleCalculate} disabled={isLoading}>
 *       Calculate Cost
 *     </button>
 *   );
 * }
 * ```
 */
export function useWalrusStorageCost() {
  const sdk = useStorewaveSDK();
  const [state, setState] = useState<StorageCostState>({
    result: null,
    isLoading: false,
    error: null,
  });

  /**
   * Calculate the storage cost for given parameters
   * Uses SDK's getReservationCost which returns system-only cost for backward compatibility
   *
   * @param params - Storage cost parameters
   * @param params.size - Size of the data in bytes
   * @param params.epochs - Number of epochs to store the data
   * @returns Promise resolving to the storage cost result
   * @throws Error if the calculation fails
   */
  const calculateCost = useCallback(
    async (params: StorageCostParams): Promise<StorageCostResult> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Use SDK to get reservation cost (includes optimization + system-only)
        const costData = await sdk.getReservationCost({
          size: params.size,
          sizeUnit: 'bytes',
          durationInEpochs: params.epochs,
        });

        // Return system-only cost for backward compatibility
        const result: StorageCostResult = {
          storageCost: costData.systemOnlyRoute.totalCostInFrost,
        };

        setState({
          result,
          isLoading: false,
          error: null,
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setState({
          result: null,
          isLoading: false,
          error: errorMessage,
        });

        throw error;
      }
    },
    [sdk]
  );

  /**
   * Calculate storage costs for multiple items in batch
   * Returns individual costs per item for accurate pricing
   *
   * @param items - Array of items with size and epoch information
   * @returns Promise resolving to array of costs matching input items
   */
  const calculateBatchCosts = useCallback(
    async (
      items: Array<{ sizeBytes: number; epochs: number }>
    ): Promise<StorageCostResult[]> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const results = await Promise.all(
          items.map(async (item) => {
            const costData = await sdk.getReservationCost({
              size: item.sizeBytes,
              sizeUnit: 'bytes',
              durationInEpochs: item.epochs,
            });
            return {
              storageCost: costData.systemOnlyRoute.totalCostInFrost,
            };
          })
        );

        setState({
          result: results[0] || null,
          isLoading: false,
          error: null,
        });

        return results;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setState({
          result: null,
          isLoading: false,
          error: errorMessage,
        });

        throw error;
      }
    },
    [sdk]
  );

  /**
   * Reset the state to initial values
   */
  const reset = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    calculateCost,
    calculateBatchCosts,
    reset,
    ...state,
  };
}
