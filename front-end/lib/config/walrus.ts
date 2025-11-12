import { walrus } from '@mysten/walrus';
import type { ClientWithCoreApi } from '@mysten/sui/experimental';

/**
 * Walrus network configuration
 */
export const walrusConfig = {
  network: 'testnet' as const,
  aggregator: process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space',
};

/**
 * Creates a Walrus-extended Sui client
 * @param suiClient - The base Sui client to extend
 * @returns Sui client extended with Walrus functionality
 */
export function createWalrusClient(suiClient: ClientWithCoreApi) {
  return suiClient.$extend(
    walrus({
      network: walrusConfig.network,
    })
  );
}
