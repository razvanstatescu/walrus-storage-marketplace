"use client"

import { useState, useEffect } from 'react'
import { useStorewaveSDK } from './useStorewaveSDK'
import { frostToWal } from 'storewave-sdk'
import { useWalletConnection } from './useWalletConnection'

/**
 * WAL balance state interface
 * @interface WalBalanceState
 */
export interface WalBalanceState {
  /** Current WAL balance (in WAL, not FROST) */
  balance: number | null
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Function to manually refresh the balance */
  refresh: () => Promise<void>
}

/**
 * Hook to fetch and monitor WAL token balance
 *
 * Automatically fetches the balance when wallet is connected and refreshes every 10 seconds.
 * Converts from FROST (smallest unit) to WAL (1 WAL = 1,000,000,000 FROST).
 *
 * @returns {WalBalanceState} WAL balance state and refresh function
 *
 * @example
 * ```tsx
 * const { balance, isLoading, error } = useWalBalance();
 *
 * if (isLoading) return <span>Loading...</span>;
 * if (error) return <span>Error</span>;
 * if (balance === null) return <span>N/A</span>;
 *
 * return <span>{balance.toFixed(1)} WAL</span>;
 * ```
 */
export const useWalBalance = (): WalBalanceState => {
  const sdk = useStorewaveSDK()
  const { address, isConnected } = useWalletConnection()

  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch the current WAL balance
   */
  const fetchBalance = async (): Promise<void> => {
    if (!address || !isConnected) {
      setBalance(null)
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch balance using SDK (returns FROST)
      const balanceInFrost = await sdk.getWalBalance(address)

      // Convert from FROST to WAL using SDK utility
      const walBalance = frostToWal(balanceInFrost)

      setBalance(walBalance)
    } catch (err) {
      console.error('Failed to fetch WAL balance:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setBalance(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch balance on mount and when address/connection changes
  useEffect(() => {
    fetchBalance()
  }, [address, isConnected])

  // Auto-refresh every 10 seconds when connected
  useEffect(() => {
    if (!isConnected || !address) return

    const interval = setInterval(() => {
      fetchBalance()
    }, 10_000) // 10 seconds

    return () => clearInterval(interval)
  }, [isConnected, address, fetchBalance])

  return {
    balance,
    isLoading,
    error,
    refresh: fetchBalance,
  }
}
