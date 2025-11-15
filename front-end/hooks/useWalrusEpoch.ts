"use client";

import { useState, useEffect, useCallback } from "react";
import { useStorewaveSDK } from "./useStorewaveSDK";

interface WalrusEpochState {
  epoch: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * React hook for fetching the current Walrus epoch
 *
 * @param options - Hook options
 * @param options.autoRefresh - Whether to automatically refresh the epoch (default: true)
 * @param options.refreshInterval - Refresh interval in milliseconds (default: 30000 - 30 seconds)
 * @returns Object containing the current epoch, loading state, error state, and refresh function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { epoch, isLoading, error, refresh } = useWalrusEpoch();
 *
 *   if (isLoading) return <div>Loading epoch...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return <div>Current Epoch: {epoch}</div>;
 * }
 * ```
 */
export function useWalrusEpoch(options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options || {};
  const sdk = useStorewaveSDK();
  const [state, setState] = useState<WalrusEpochState>({
    epoch: null,
    isLoading: false,
    error: null,
  });

  /**
   * Fetch the current epoch using SDK
   */
  const fetchEpoch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const epoch = await sdk.getCurrentEpoch();

      setState({
        epoch,
        isLoading: false,
        error: null,
      });

      return epoch;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState({
        epoch: null,
        isLoading: false,
        error: errorMessage,
      });

      throw error;
    }
  }, [sdk]);

  /**
   * Refresh the epoch
   */
  const refresh = useCallback(() => {
    return fetchEpoch();
  }, [fetchEpoch]);

  // Fetch epoch on mount
  useEffect(() => {
    fetchEpoch();
  }, [fetchEpoch]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchEpoch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchEpoch]);

  return {
    epoch: state.epoch,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
  };
}
