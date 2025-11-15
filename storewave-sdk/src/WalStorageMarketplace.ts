/**
 * Main SDK class for Walrus Storage Marketplace
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { CoinStruct } from '@mysten/sui/client';
import { getNetworkConfig, type NetworkConfig } from './config/networks.js';
import { DEFAULT_PAGINATION_LIMIT, MAX_PAGINATION_LIMIT } from './config/constants.js';
import { BackendClient } from './api/backend-client.js';
import {
  buildStoragePurchasePTB,
  buildListStoragePTB,
  buildListBlobAsStoragePTB,
  dryRunPTB,
} from './builders/ptb-builder.js';
import {
  convertToBytes,
  convertToStorageUnits,
  walToFrost,
  frostToWal,
} from './utils/storage-units.js';
import {
  validateSizeUnit,
  validatePositiveNumber,
  validatePositiveInteger,
  validateSuiAddress,
  validateObjectIds,
  validatePaginationLimit,
  validatePricesMatchObjects,
} from './utils/validators.js';
import type {
  Network,
  SDKOptions,
  SizeUnit,
  WalrusStorage,
  WalrusBlob,
  PaginatedStorage,
  PaginatedBlobs,
  PaginatedListings,
  OptimizationResult,
} from './types/index.js';
import { UnsupportedNetworkError, NoWalCoinsError } from './types/index.js';

/**
 * Main SDK class for interacting with Walrus Storage Marketplace
 *
 * @example
 * ```typescript
 * const sdk = new WalStorageMarketplace('testnet', {
 *   backendApiUrl: 'http://localhost:3000'
 * });
 *
 * // Get cost preview
 * const cost = await sdk.getReservationCost({
 *   size: 5,
 *   sizeUnit: 'GiB',
 *   durationInEpochs: 100,
 * });
 *
 * // Reserve storage
 * const tx = new Transaction();
 * const result = await sdk.reserveStorage({
 *   tx,
 *   size: 5,
 *   sizeUnit: 'GiB',
 *   durationInEpochs: 100,
 *   senderAddress: '0x...',
 * });
 * ```
 */
export class WalStorageMarketplace {
  private suiClient: SuiClient;
  public readonly network: Network;
  private config: NetworkConfig;
  private backendClient: BackendClient;

  /**
   * Create a new WalStorageMarketplace instance
   *
   * @param network - Network to use ('testnet' or 'mainnet')
   * @param options - Optional configuration overrides
   */
  constructor(network: Network, options?: SDKOptions) {
    if (network !== 'testnet' && network !== 'mainnet') {
      throw new UnsupportedNetworkError(network);
    }

    this.network = network;
    this.config = getNetworkConfig(network);

    this.suiClient = new SuiClient({
      url: options?.rpcUrl || this.config.rpcUrl,
    });

    this.backendClient = new BackendClient(
      options?.backendApiUrl || this.config.backendApiUrl,
    );
  }

  /**
   * Get the current Walrus epoch
   *
   * @returns Current epoch number
   */
  async getCurrentEpoch(): Promise<number> {
    const systemState = await this.suiClient.getObject({
      id: this.config.walrusSystemObjectId,
      options: { showContent: true },
    });

    if (
      !systemState.data?.content ||
      systemState.data.content.dataType !== 'moveObject'
    ) {
      throw new Error('Failed to fetch Walrus system state');
    }

    const fields = systemState.data.content.fields as any;
    return Number(fields.epoch || fields.current_epoch || 0);
  }

  /**
   * Get WAL coin objects for an address
   *
   * @param address - Wallet address
   * @returns Array of WAL coin objects
   */
  async getWalCoins(address: string): Promise<CoinStruct[]> {
    validateSuiAddress(address);

    const coins = await this.suiClient.getCoins({
      owner: address,
      coinType: this.config.walTokenType,
    });

    return coins.data;
  }

  /**
   * Get total WAL balance for an address
   *
   * @param address - Wallet address
   * @returns Total balance in FROST (smallest unit)
   */
  async getWalBalance(address: string): Promise<bigint> {
    validateSuiAddress(address);

    const balance = await this.suiClient.getBalance({
      owner: address,
      coinType: this.config.walTokenType,
    });

    return BigInt(balance.totalBalance);
  }

  /**
   * Get storage objects owned by an address
   *
   * @param params - Query parameters
   * @returns Paginated storage objects
   */
  async getWalletStorage(params: {
    address: string;
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedStorage> {
    validateSuiAddress(params.address);
    validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);

    const result = await this.suiClient.getOwnedObjects({
      owner: params.address,
      filter: {
        StructType: this.config.storageObjectType,
      },
      options: {
        showContent: true,
        showType: true,
      },
      cursor: params.cursor,
      limit: params.limit || DEFAULT_PAGINATION_LIMIT,
    });

    const storageObjects: WalrusStorage[] = result.data
      .filter((obj) => obj.data?.content && 'fields' in obj.data.content)
      .map((obj) => {
        const fields = (obj.data!.content as any).fields;
        return {
          objectId: obj.data!.objectId,
          storageSize: BigInt(fields.storage_size || fields.size || 0),
          startEpoch: Number(fields.start_epoch || 0),
          endEpoch: Number(fields.end_epoch || 0),
        };
      });

    return {
      data: storageObjects,
      nextCursor: result.nextCursor || null,
      hasMore: result.hasNextPage,
    };
  }

  /**
   * Get blob objects owned by an address
   *
   * @param params - Query parameters
   * @returns Paginated blob objects
   */
  async getWalletBlobs(params: {
    address: string;
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedBlobs> {
    validateSuiAddress(params.address);
    validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);

    const result = await this.suiClient.getOwnedObjects({
      owner: params.address,
      filter: {
        StructType: this.config.blobObjectType,
      },
      options: {
        showContent: true,
        showType: true,
      },
      cursor: params.cursor,
      limit: params.limit || DEFAULT_PAGINATION_LIMIT,
    });

    const blobs: WalrusBlob[] = result.data
      .filter((obj) => obj.data?.content && 'fields' in obj.data.content)
      .map((obj) => {
        const fields = (obj.data!.content as any).fields;
        const storageFields = fields.storage?.fields || {};

        return {
          objectId: obj.data!.objectId,
          blobId: fields.blob_id || fields.id || '',
          size: BigInt(fields.size || 0),
          encodingType: Number(fields.encoding_type || 0),
          registeredEpoch: Number(fields.registered_epoch || 0),
          certifiedEpoch: fields.certified_epoch ? Number(fields.certified_epoch) : null,
          deletable: Boolean(fields.deletable),
          storage: {
            objectId: fields.storage?.id || storageFields.id?.id || '',
            startEpoch: Number(storageFields.start_epoch || 0),
            endEpoch: Number(storageFields.end_epoch || 0),
            storageSize: BigInt(storageFields.storage_size || storageFields.size || 0),
          },
        };
      });

    return {
      data: blobs,
      nextCursor: result.nextCursor || null,
      hasMore: result.hasNextPage,
    };
  }

  /**
   * Get marketplace listings for a seller
   *
   * @param params - Query parameters
   * @returns Paginated listings
   */
  async getListingsByAddress(params: {
    address: string;
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedListings> {
    validateSuiAddress(params.address);
    validatePaginationLimit(params.limit, MAX_PAGINATION_LIMIT);

    return this.backendClient.getListings({
      seller: params.address,
      cursor: params.cursor,
      limit: params.limit || DEFAULT_PAGINATION_LIMIT,
    });
  }

  /**
   * List storage objects on the marketplace
   *
   * @param params - Listing parameters
   * @returns Modified transaction ready for signing
   */
  async listStorage(params: {
    tx: Transaction;
    storageObjectIds: string[];
    pricesInWal: number[];
    senderAddress: string;
  }): Promise<Transaction> {
    validateObjectIds(params.storageObjectIds, 'storageObjectIds');
    validatePricesMatchObjects(params.storageObjectIds, params.pricesInWal);
    validateSuiAddress(params.senderAddress);

    const pricesInFrost = params.pricesInWal.map((price) => walToFrost(price));

    return buildListStoragePTB(
      params.tx,
      params.storageObjectIds,
      pricesInFrost,
      this.config,
    );
  }

  /**
   * List blob objects as storage on the marketplace
   * First deletes the blob to get storage, then lists it
   *
   * @param params - Listing parameters
   * @returns Modified transaction ready for signing
   */
  async listBlobAsStorage(params: {
    tx: Transaction;
    blobObjectIds: string[];
    pricesInWal: number[];
    senderAddress: string;
  }): Promise<Transaction> {
    validateObjectIds(params.blobObjectIds, 'blobObjectIds');
    validatePricesMatchObjects(params.blobObjectIds, params.pricesInWal);
    validateSuiAddress(params.senderAddress);

    const pricesInFrost = params.pricesInWal.map((price) => walToFrost(price));

    return buildListBlobAsStoragePTB(
      params.tx,
      params.blobObjectIds,
      pricesInFrost,
      this.config,
    );
  }

  /**
   * Get cost preview for storage reservation
   * Automatically uses current epoch as start epoch
   *
   * @param params - Reservation parameters
   * @returns Cost comparison between optimized and system-only routes
   */
  async getReservationCost(params: {
    size: number;
    sizeUnit?: SizeUnit;
    durationInEpochs: number;
  }): Promise<{
    optimizedRoute: {
      totalCostInFrost: bigint;
      totalCostInWal: number;
      operations: any[];
      usesMarketplace: boolean;
    };
    systemOnlyRoute: {
      totalCostInFrost: bigint;
      totalCostInWal: number;
      storageUnits: number;
    };
    savingsInFrost: bigint;
    savingsInWal: number;
    savingsPercentage: number;
    recommendation: 'optimized' | 'system-only';
    currentEpoch: number;
    endEpoch: number;
  }> {
    const unit = params.sizeUnit || 'bytes';
    if (unit !== 'bytes') {
      validateSizeUnit(unit);
    }
    validatePositiveNumber(params.size, 'size');
    validatePositiveInteger(params.durationInEpochs, 'durationInEpochs');

    const sizeInBytes = convertToBytes(params.size, unit);
    const currentEpoch = await this.getCurrentEpoch();
    const startEpoch = currentEpoch;
    const endEpoch = currentEpoch + params.durationInEpochs;

    // Get optimization result from backend
    let optimizationResult: OptimizationResult | null = null;
    try {
      optimizationResult = await this.backendClient.optimize({
        size: sizeInBytes.toString(),
        startEpoch,
        endEpoch,
      });
    } catch (error) {
      // Backend optimization failed, will use system-only
      console.warn('Optimization failed, falling back to system-only:', error);
    }

    // Calculate system-only cost
    const storageUnits = convertToStorageUnits(sizeInBytes);
    const systemOnlyCostInFrost = BigInt(storageUnits) * BigInt(params.durationInEpochs) * BigInt(1_000_000_000); // Placeholder formula

    let optimizedCostInFrost: bigint;
    let operations: any[] = [];
    let usesMarketplace = false;

    if (optimizationResult) {
      optimizedCostInFrost = BigInt(optimizationResult.totalCost);
      operations = optimizationResult.operations;
      usesMarketplace = operations.some(
        (op) => op.type === 'buy_full_storage' || op.type === 'buy_partial_storage_size',
      );
    } else {
      optimizedCostInFrost = systemOnlyCostInFrost;
    }

    const savingsInFrost =
      systemOnlyCostInFrost > optimizedCostInFrost
        ? systemOnlyCostInFrost - optimizedCostInFrost
        : 0n;
    const savingsPercentage =
      systemOnlyCostInFrost > 0n
        ? (Number(savingsInFrost) / Number(systemOnlyCostInFrost)) * 100
        : 0;

    return {
      optimizedRoute: {
        totalCostInFrost: optimizedCostInFrost,
        totalCostInWal: frostToWal(optimizedCostInFrost),
        operations,
        usesMarketplace,
      },
      systemOnlyRoute: {
        totalCostInFrost: systemOnlyCostInFrost,
        totalCostInWal: frostToWal(systemOnlyCostInFrost),
        storageUnits,
      },
      savingsInFrost,
      savingsInWal: frostToWal(savingsInFrost),
      savingsPercentage,
      recommendation: savingsInFrost > 0n ? 'optimized' : 'system-only',
      currentEpoch,
      endEpoch,
    };
  }

  /**
   * Reserve storage with automatic coin fetching
   * Automatically uses current epoch as start epoch
   *
   * @param params - Reservation parameters
   * @returns Modified transaction and dry run result
   */
  async reserveStorage(params: {
    tx: Transaction;
    size: number;
    sizeUnit?: SizeUnit;
    durationInEpochs: number;
    senderAddress: string;
    useOptimization?: boolean;
    performDryRun?: boolean;
  }): Promise<{
    transaction: Transaction;
    dryRunResult?: {
      success: boolean;
      usedSystemFallback: boolean;
      error?: string;
    };
    estimatedCostInFrost: bigint;
    estimatedCostInWal: number;
    currentEpoch: number;
    endEpoch: number;
  }> {
    const unit = params.sizeUnit || 'bytes';
    if (unit !== 'bytes') {
      validateSizeUnit(unit);
    }
    validatePositiveNumber(params.size, 'size');
    validatePositiveInteger(params.durationInEpochs, 'durationInEpochs');
    validateSuiAddress(params.senderAddress);

    const useOptimization = params.useOptimization ?? true;
    const performDryRun = params.performDryRun ?? true;

    // Auto-fetch WAL coins
    const walCoins = await this.getWalCoins(params.senderAddress);
    if (walCoins.length === 0) {
      throw new NoWalCoinsError(params.senderAddress);
    }
    const walCoinIds = walCoins.map((coin) => coin.coinObjectId);

    // Get current epoch
    const currentEpoch = await this.getCurrentEpoch();
    const startEpoch = currentEpoch;
    const endEpoch = currentEpoch + params.durationInEpochs;
    const sizeInBytes = convertToBytes(params.size, unit);

    // Get optimization result
    let optimizationResult: OptimizationResult;

    if (useOptimization) {
      try {
        optimizationResult = await this.backendClient.optimize({
          size: sizeInBytes.toString(),
          startEpoch,
          endEpoch,
        });
      } catch (error) {
        // Fall back to system-only
        optimizationResult = this.createSystemOnlyOptimization(
          sizeInBytes,
          startEpoch,
          endEpoch,
        );
      }
    } else {
      optimizationResult = this.createSystemOnlyOptimization(
        sizeInBytes,
        startEpoch,
        endEpoch,
      );
    }

    // Build PTB
    buildStoragePurchasePTB(
      params.tx,
      optimizationResult,
      walCoinIds,
      params.senderAddress,
      this.config,
    );

    let dryRunResult: { success: boolean; usedSystemFallback: boolean; error?: string } | undefined;

    // Perform dry run if requested
    if (performDryRun) {
      const result = await dryRunPTB(params.tx, this.suiClient, params.senderAddress);

      if (!result.success && useOptimization) {
        // Marketplace failed, try system-only
        const systemOnlyOptimization = this.createSystemOnlyOptimization(
          sizeInBytes,
          startEpoch,
          endEpoch,
        );

        // Rebuild transaction with system-only
        const newTx = new Transaction();
        buildStoragePurchasePTB(
          newTx,
          systemOnlyOptimization,
          walCoinIds,
          params.senderAddress,
          this.config,
        );

        const retryResult = await dryRunPTB(newTx, this.suiClient, params.senderAddress);

        if (retryResult.success) {
          // Use system-only transaction
          params.tx = newTx;
          optimizationResult = systemOnlyOptimization;
          dryRunResult = {
            success: true,
            usedSystemFallback: true,
          };
        } else {
          dryRunResult = {
            success: false,
            usedSystemFallback: false,
            error: retryResult.error,
          };
        }
      } else {
        dryRunResult = {
          success: result.success,
          usedSystemFallback: false,
          error: result.error,
        };
      }
    }

    const estimatedCostInFrost = BigInt(optimizationResult.totalCost);

    return {
      transaction: params.tx,
      dryRunResult,
      estimatedCostInFrost,
      estimatedCostInWal: frostToWal(estimatedCostInFrost),
      currentEpoch,
      endEpoch,
    };
  }

  /**
   * Create a system-only optimization result (fallback)
   */
  private createSystemOnlyOptimization(
    sizeInBytes: number,
    startEpoch: number,
    endEpoch: number,
  ): OptimizationResult {
    const storageUnits = convertToStorageUnits(sizeInBytes);
    const duration = endEpoch - startEpoch;
    const cost = BigInt(storageUnits) * BigInt(duration) * BigInt(1_000_000_000); // Placeholder

    return {
      operations: [
        {
          type: 'reserve_space',
          reserveSize: sizeInBytes.toString(),
          startEpoch,
          endEpoch,
          cost: cost.toString(),
        },
      ],
      totalCost: cost.toString(),
      systemOnlyPrice: cost.toString(),
      allocations: [],
      ptbMetadata: {
        operations: [
          {
            type: 'reserve_space',
            reserveSize: sizeInBytes.toString(),
            startEpoch,
            endEpoch,
            cost: cost.toString(),
          },
        ],
        expectedCost: cost.toString(),
        paymentAmounts: [cost.toString()],
      },
    };
  }
}
