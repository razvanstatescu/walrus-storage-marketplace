"use client";

import { useState, useCallback } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import {
  buildStoragePurchasePTB,
  isSystemOnly,
  dryRunPTB,
  MixedOperationFailureError,
  type ContractConfig,
} from "@/lib/utils/ptb-builder";

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

interface ExecutionFlow {
  operationIndex: number;
  type: string;
  producesStorage: boolean;
  storageRef?: string;
  paymentIndex?: number;
  sellerAddress?: string;
  inputStorageFromOperation?: number;
  fuseTargets?: {
    first: number;
    second: number;
  };
}

interface PTBMetadata {
  paymentAmounts: string[];
  executionFlow: ExecutionFlow[];
}

interface OptimizationResult {
  operations: StorageOperation[];
  totalCost: string; // bigint as string (in FROST)
  systemOnlyPrice: string; // bigint as string (in FROST)
  allocations: Allocation[];
  needsNewReservation?: NewReservation;
  ptbMetadata: PTBMetadata;
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

  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

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
   * Execute storage purchase using the optimization result
   *
   * @param optimizationResult - Result from optimize() call
   * @param walCoinIds - Array of WAL Coin object IDs to use for payment
   * @param contractConfig - Contract addresses and package IDs
   * @returns Transaction result
   *
   * @example
   * ```tsx
   * const { optimize, executePurchase } = useStorageOptimizer();
   *
   * // First optimize
   * const result = await optimize({ size: "1048576", startEpoch: 100, endEpoch: 130 });
   *
   * // Then execute purchase
   * const contractConfig = {
   *   marketplacePackageId: "0x...",
   *   marketplaceObjectId: "0x...",
   *   walrusSystemObjectId: "0x...",
   *   walrusPackageId: "0x..."
   * };
   * const txResult = await executePurchase(result, ["0xwalcoin1", "0xwalcoin2"], contractConfig);
   * ```
   */
  const executePurchase = useCallback(
    async (
      optimizationResult: OptimizationResult,
      walCoinIds: string[],
      contractConfig: ContractConfig,
    ) => {
      if (!currentAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        // Build the PTB
        const tx = buildStoragePurchasePTB(
          optimizationResult,
          walCoinIds,
          contractConfig,
          currentAccount.address,
        );

        // Safety check: If NOT system-only (marketplace or mixed), dry run first
        if (!isSystemOnly(optimizationResult)) {
          console.log("[Transaction] Marketplace operations detected, performing dry run...");
          const dryRunResult = await dryRunPTB(tx, suiClient, currentAccount.address);

          if (!dryRunResult.success) {
            console.error("[Transaction] Dry run failed:", dryRunResult.error);
            // Throw special error that includes suggestion
            throw new MixedOperationFailureError(
              "Transaction would fail. Consider using system storage only.",
              dryRunResult.error,
            );
          }

          console.log("[Transaction] Dry run passed successfully");
        }

        // Inspect transaction for debugging
        console.log("[Transaction] Inspecting built transaction:");
        console.log("[Transaction] Transaction data:", JSON.stringify(tx.getData(), null, 2));

        // Sign and execute
        const result = await signAndExecuteTransaction({
          transaction: tx,
        });

        return result;
      } catch (error) {
        // Re-throw MixedOperationFailureError as-is
        if (error instanceof MixedOperationFailureError) {
          throw error;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Purchase execution failed: ${errorMessage}`);
      }
    },
    [currentAccount, signAndExecuteTransaction, suiClient],
  );

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
    executePurchase,
    result: state.result,
    isLoading: state.isLoading,
    error: state.error,
    reset,
  };
}
