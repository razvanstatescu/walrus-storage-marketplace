/**
 * Network configurations for Walrus Storage Marketplace
 */

export type Network = 'testnet' | 'mainnet';

export interface NetworkConfig {
  /** Sui RPC endpoint URL */
  rpcUrl: string;

  /** Backend API URL for optimization and indexing */
  backendApiUrl: string;

  /** Marketplace smart contract package ID */
  marketplacePackageId: string;

  /** Marketplace configuration shared object ID */
  marketplaceConfigId: string;

  /** Walrus system package ID */
  walrusPackageId: string;

  /** Walrus system shared object ID */
  walrusSystemObjectId: string;

  /** Storage object type */
  storageObjectType: string;

  /** Blob object type */
  blobObjectType: string;

  /** WAL token type */
  walTokenType: string;

  /** Explorer base URL */
  explorerUrl: string;
}

/**
 * Network configurations
 */
export const NETWORKS: Record<Network, NetworkConfig> = {
  testnet: {
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    backendApiUrl: 'http://localhost:3000',
    marketplacePackageId: '0xbd82d72afa3227a3869d2f44735a4ffed627fb4079557e12f846f20dbcfecf75',
    marketplaceConfigId: '0x7dca7b165200a9cc73914072c1161144b818322c5a4b456bd277d9082e2e4984',
    walrusPackageId: '0xa998b8719ca1c0a6dc4e24a859bbb39f5477417f71885fbf2967a6510f699144',
    walrusSystemObjectId: '0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af',
    storageObjectType: '0xd84704c17fc870b8764832c535aa6b11f21a95cd6f5bb38a9b07d2cf42220c66::storage_resource::Storage',
    blobObjectType: '0xd84704c17fc870b8764832c535aa6b11f21a95cd6f5bb38a9b07d2cf42220c66::blob::Blob',
    walTokenType: '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL',
    explorerUrl: 'https://testnet.suivision.xyz',
  },
  mainnet: {
    // Placeholder - to be filled when mainnet launches
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    backendApiUrl: '', // TBD
    marketplacePackageId: '', // TBD
    marketplaceConfigId: '', // TBD
    walrusPackageId: '', // TBD
    walrusSystemObjectId: '', // TBD
    storageObjectType: '', // TBD
    blobObjectType: '', // TBD
    walTokenType: '', // TBD
    explorerUrl: 'https://suivision.xyz',
  },
} as const;

/**
 * Get network configuration by network name
 */
export function getNetworkConfig(network: Network): NetworkConfig {
  return NETWORKS[network];
}

/**
 * Validate if network is supported
 */
export function isSupportedNetwork(network: string): network is Network {
  return network === 'testnet' || network === 'mainnet';
}
