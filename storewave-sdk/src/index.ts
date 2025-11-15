/**
 * Storewave SDK - TypeScript SDK for Walrus Storage Marketplace
 *
 * @packageDocumentation
 */

// Main SDK class
export { WalStorageMarketplace } from './WalStorageMarketplace.js';

// Type exports
export type {
  // Network types
  Network,
  SDKOptions,
  // Storage types
  SizeUnit,
  WalrusStorage,
  WalrusBlob,
  ListedStorage,
  PaginatedResponse,
  PaginatedStorage,
  PaginatedBlobs,
  PaginatedListings,
  // API types
  OperationType,
  BuyFullStorageOperation,
  BuyPartialStorageOperation,
  ReserveSpaceOperation,
  FuseAmountOperation,
  Operation,
  Allocation,
  NewReservation,
  PTBMetadata,
  OptimizationResult,
  OptimizationRequest,
} from './types/index.js';

// Error exports
export {
  StorewaveError,
  InsufficientBalanceError,
  DryRunFailureError,
  BackendError,
  ValidationError,
  UnsupportedNetworkError,
  NoWalCoinsError,
} from './types/index.js';

// Utility function exports (optional, for advanced use cases)
export {
  convertToBytes,
  convertToStorageUnits,
  formatStorageSize,
  frostToWal,
  walToFrost,
  formatWalPrice,
} from './utils/storage-units.js';

// Constants exports
export {
  BYTES_PER_UNIT_SIZE,
  WAL_DECIMALS,
  FROST_PER_WAL,
  UNIT_MULTIPLIERS,
} from './config/constants.js';

// Network config exports (for advanced use cases)
export { NETWORKS, getNetworkConfig, isSupportedNetwork } from './config/networks.js';
export type { NetworkConfig } from './config/networks.js';
