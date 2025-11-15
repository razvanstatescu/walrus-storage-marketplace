/**
 * Network-related type definitions
 */

/**
 * Supported networks
 */
export type Network = 'testnet' | 'mainnet';

/**
 * SDK initialization options
 */
export interface SDKOptions {
  /** Custom RPC URL (overrides default) */
  rpcUrl?: string;

  /** Custom backend API URL (overrides default) */
  backendApiUrl?: string;
}
