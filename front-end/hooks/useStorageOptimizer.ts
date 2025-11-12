"use client";

import { useState, useCallback } from "react";

interface OptimizeStorageRequest {
  size: string; // bigint as string (in bytes)
  startEpoch: number;
  endEpoch: number;
}

interface StorageOperation {
  type: string;
  description: string;
  storageObjectId?: string;
  splitSize?: string;
  splitStartEpoch?: number;
  splitEndEpoch?: number;
  splitEpoch?: number;
  reserveSize?: string;
  startEpoch?: number;
  endEpoch?: number;
  cost?: string;
}

interface Allocation {
  storageObjectId: string;
  usedSize: string;
  usedStartEpoch: number;
  usedEndEpoch: number;
  cost: string;
  sellerPayment: string;
  seller?: string;
}

interface NewReservation {
  size: string;
  epochs: number;
  cost: string;
}

interface OptimizationResult {
  operations: StorageOperation[];
  totalCost: string; // bigint as string (in FROST)
  systemOnlyPrice: string; // bigint as string (in FROST)
  allocations: Allocation[];
  needsNewReservation?: NewReservation;
}

interface StorageOptimizerState {
  result: OptimizationResult | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * React hook for optimizing storage allocation via backend API
 *
 * @returns Object containing optimize function, result, loading state, error state, and reset function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { optimize, result, isLoading, error } = useStorageOptimizer();
 *
 *   const handleOptimize = async () => {
 *     await optimize({
 *       size: "1048576", // 1 MiB in bytes
 *       startEpoch: 100,
 *       endEpoch: 130
 *     });
 *   };
 *
 *   if (isLoading) return <div>Optimizing...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (result) return <div>Total Cost: {result.totalCost} FROST</div>;
 * }
 * ```
 */
export function useStorageOptimizer() {
  const [state, setState] = useState<StorageOptimizerState>({
    result: null,
    isLoading: false,
    error: null,
  });

  /**
   * Optimize storage allocation
   */
  const optimize = useCallback(async (params: OptimizeStorageRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/storage-optimizer/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: OptimizationResult = await response.json();

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
  }, []);

  /**
   * Reset the state
   */
  const reset = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    optimize,
    result: state.result,
    isLoading: state.isLoading,
    error: state.error,
    reset,
  };
}
