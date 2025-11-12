"use client";

import { useState, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { calculateStorageCost } from "@/lib/utils/walrus";
import type {
  StorageCostParams,
  StorageCostResult,
  StorageCostState,
} from "@/types/storage";

/**
 * React hook for calculating Walrus storage costs
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
  const suiClient = useSuiClient();
  const [state, setState] = useState<StorageCostState>({
    result: null,
    isLoading: false,
    error: null,
  });

  /**
   * Calculate the storage cost for given parameters
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
        const result = await calculateStorageCost(suiClient, params);

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
    [suiClient]
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
    reset,
    ...state,
  };
}
