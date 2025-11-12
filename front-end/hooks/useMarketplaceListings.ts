"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface ListedStorage {
  storageId: string;
  seller: string;
  size: bigint;
  startEpoch: number;
  endEpoch: number;
  totalPrice: bigint;
  listedAt: Date;
  lastUpdatedAt: Date;
}

interface UseMarketplaceListingsState {
  listings: ListedStorage[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch marketplace listings for the current user
 * Uses the backend API endpoint: GET /indexer/listings?seller={address}
 */
export function useMarketplaceListings() {
  const currentAccount = useCurrentAccount();
  const [state, setState] = useState<UseMarketplaceListingsState>({
    listings: [],
    isLoading: false,
    error: null,
  });

  const fetchListings = useCallback(async () => {
    if (!currentAccount?.address) {
      setState({ listings: [], isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiUrl}/indexer/listings?seller=${currentAccount.address}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }

      const data = await response.json();

      // Convert BigInt fields from strings
      const listings = data.map((item: any) => ({
        ...item,
        size: BigInt(item.size),
        totalPrice: BigInt(item.totalPrice),
        listedAt: new Date(item.listedAt),
        lastUpdatedAt: new Date(item.lastUpdatedAt),
      }));

      setState({
        listings,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState({
        listings: [],
        isLoading: false,
        error: errorMessage,
      });
    }
  }, [currentAccount?.address]);

  // Fetch on mount and when account changes
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings: state.listings,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchListings,
  };
}
