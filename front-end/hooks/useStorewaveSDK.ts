/**
 * Hook to get a singleton instance of the Storewave SDK
 */

import { useMemo } from 'react';
import { WalStorageMarketplace } from 'storewave-sdk';

/**
 * Provides a memoized instance of the Storewave SDK
 * configured with the current network and backend API URL
 */
export function useStorewaveSDK() {
  const network = (process.env.NEXT_PUBLIC_NETWORK || 'testnet') as 'testnet' | 'mainnet';
  const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  return useMemo(
    () =>
      new WalStorageMarketplace(network, {
        backendApiUrl,
      }),
    [network, backendApiUrl]
  );
}
