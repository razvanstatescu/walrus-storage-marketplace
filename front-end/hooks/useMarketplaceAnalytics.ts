"use client";

import { useState, useEffect, useCallback } from "react";

export interface MarketplaceAnalytics {
  totalActiveListings: number;
  totalUniqueStorageIdsListed: number;
  totalPurchases: number;
  totalSizeListed: string; // BigInt as string (bytes)
  totalValueListed: string; // BigInt as string (MIST/WAL)
  totalSizePurchased: string; // BigInt as string (bytes)
  totalValuePurchased: string; // BigInt as string (MIST/WAL)
}

interface UseMarketplaceAnalyticsResult {
  analytics: MarketplaceAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMarketplaceAnalytics(): UseMarketplaceAnalyticsResult {
  const [analytics, setAnalytics] = useState<MarketplaceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/indexer/analytics`);

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch analytics";
      setError(errorMessage);
      console.error("Error fetching marketplace analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}
