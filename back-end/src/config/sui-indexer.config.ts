import { registerAs } from '@nestjs/config';

export interface SuiIndexerConfig {
  enabled: boolean;
  network: 'mainnet' | 'testnet' | 'devnet';
  packageId: string;
  pollingIntervalMs: number;
  rpcUrl?: string;
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
}

export default registerAs('suiIndexer', (): SuiIndexerConfig => {
  const network = (process.env.SUI_NETWORK || 'testnet') as
    | 'mainnet'
    | 'testnet'
    | 'devnet';

  const defaultRpcUrls = {
    mainnet: 'https://fullnode.mainnet.sui.io:443',
    testnet: 'https://fullnode.testnet.sui.io:443',
    devnet: 'https://fullnode.devnet.sui.io:443',
  };

  return {
    enabled: process.env.SUI_INDEXER_ENABLED === 'true',
    network,
    packageId: process.env.SUI_PACKAGE_ID || '',
    pollingIntervalMs: parseInt(
      process.env.SUI_INDEXER_POLLING_INTERVAL_MS || '5000',
      10,
    ),
    rpcUrl: process.env.SUI_RPC_URL || defaultRpcUrls[network],
    batchSize: parseInt(process.env.SUI_INDEXER_BATCH_SIZE || '50', 10),
    maxRetries: parseInt(process.env.SUI_INDEXER_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(
      process.env.SUI_INDEXER_RETRY_DELAY_MS || '1000',
      10,
    ),
  };
});
