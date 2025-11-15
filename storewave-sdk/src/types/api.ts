/**
 * Backend API type definitions
 */

/**
 * Operation types for storage transactions
 */
export type OperationType =
  | 'buy_full_storage'
  | 'buy_partial_storage_size'
  | 'reserve_space'
  | 'fuse_amount';

/**
 * Buy full storage operation
 */
export interface BuyFullStorageOperation {
  type: 'buy_full_storage';
  storageObjectId: string;
  cost: string;
}

/**
 * Buy partial storage by size operation
 */
export interface BuyPartialStorageOperation {
  type: 'buy_partial_storage_size';
  storageObjectId: string;
  size: string;
  cost: string;
}

/**
 * Reserve space from system operation
 */
export interface ReserveSpaceOperation {
  type: 'reserve_space';
  reserveSize: string;
  startEpoch: number;
  endEpoch: number;
  cost: string;
}

/**
 * Fuse storage pieces operation
 */
export interface FuseAmountOperation {
  type: 'fuse_amount';
  storage1Index: number;
  storage2Index: number;
}

/**
 * Union type for all operations
 */
export type Operation =
  | BuyFullStorageOperation
  | BuyPartialStorageOperation
  | ReserveSpaceOperation
  | FuseAmountOperation;

/**
 * Allocation from marketplace
 */
export interface Allocation {
  storageObjectId: string;
  size: string;
  startEpoch: number;
  endEpoch: number;
  price: string;
  seller: string;
}

/**
 * New reservation from system
 */
export interface NewReservation {
  size: string;
  startEpoch: number;
  endEpoch: number;
  cost: string;
}

/**
 * PTB metadata from optimizer
 */
export interface PTBMetadata {
  operations: Operation[];
  expectedCost: string;
  paymentAmounts: string[];
}

/**
 * Optimization result from backend
 */
export interface OptimizationResult {
  /** List of operations to execute */
  operations: Operation[];

  /** Total cost using optimized route (in FROST) */
  totalCost: string;

  /** Cost if using system-only (in FROST) */
  systemOnlyPrice: string;

  /** Marketplace allocations used */
  allocations: Allocation[];

  /** System reservation if needed */
  needsNewReservation?: NewReservation;

  /** PTB metadata for transaction building */
  ptbMetadata: PTBMetadata;
}

/**
 * Optimization request params
 */
export interface OptimizationRequest {
  /** Size in bytes (as string) */
  size: string;

  /** Starting epoch */
  startEpoch: number;

  /** Ending epoch */
  endEpoch: number;
}
