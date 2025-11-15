"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useStorewaveSDK } from "./useStorewaveSDK";
import type { ListedStorage } from "storewave-sdk";

interface UseMarketplaceListingsState {
  listings: ListedStorage[];
  isLoading: boolean;
  error: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Hook to fetch marketplace listings for the current user
 * Uses the SDK which calls backend API endpoint: GET /indexer/listings?seller={address}
 */
export function useMarketplaceListings() {
  const currentAccount = useCurrentAccount();
  const sdk = useStorewaveSDK();
  const [state, setState] = useState<UseMarketplaceListingsState>({
    listings: [],
    isLoading: false,
    error: null,
    nextCursor: null,
    hasMore: false,
  });

  const fetchListings = useCallback(async () => {
    if (!currentAccount?.address) {
      setState({
        listings: [],
        isLoading: false,
        error: null,
        nextCursor: null,
        hasMore: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await sdk.getListingsByAddress({
        address: currentAccount.address,
        limit: 50,
      });

      setState({
        listings: result.data,
        isLoading: false,
        error: null,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState({
        listings: [],
        isLoading: false,
        error: errorMessage,
        nextCursor: null,
        hasMore: false,
      });
    }
  }, [currentAccount?.address, sdk]);

  const loadMore = useCallback(async () => {
    if (!currentAccount?.address || !state.nextCursor || !state.hasMore || state.isLoading) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await sdk.getListingsByAddress({
        address: currentAccount.address,
        cursor: state.nextCursor,
        limit: 50,
      });

      setState((prev) => ({
        listings: [...prev.listings, ...result.data],
        isLoading: false,
        error: null,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [currentAccount?.address, sdk, state.nextCursor, state.hasMore, state.isLoading]);

  // Fetch on mount and when account changes
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings: state.listings,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    refetch: fetchListings,
    loadMore,
  };
}
