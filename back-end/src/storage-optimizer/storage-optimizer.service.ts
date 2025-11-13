import { Injectable, Logger } from '@nestjs/common';
import { DatabaseOperationsService } from '../sui-indexer/services/database-operations.service';
import { WalrusService } from '../walrus/walrus.service';
import {
  WalrusStorageOptimizer,
  StorageObject,
  StorageRequest,
  OptimizationResult,
  generateStorageOperations,
} from './optimizer/walrus-storage-optimizer';
import {
  OptimizationResultDto,
  StorageOperationDto,
  AllocationDto,
  NewReservationDto,
  PTBMetadataDto,
  ExecutionFlowDto,
} from './dto/optimization-result.dto';

@Injectable()
export class StorageOptimizerService {
  private readonly logger = new Logger(StorageOptimizerService.name);

  constructor(
    private readonly databaseOpsService: DatabaseOperationsService,
    private readonly walrusService: WalrusService,
  ) {}

  /**
   * Optimize storage allocation combining marketplace listings and new Walrus storage
   */
  async optimizeStorage(
    size: bigint,
    startEpoch: number,
    endEpoch: number,
  ): Promise<OptimizationResultDto> {
    try {
      this.logger.log(
        `Optimizing storage: ${size} bytes, epochs ${startEpoch}-${endEpoch}`,
      );

      // Validate input
      if (size <= 0n) {
        throw new Error('Size must be greater than 0');
      }
      if (endEpoch <= startEpoch) {
        throw new Error('End epoch must be greater than start epoch');
      }

      // 1. Fetch marketplace listings from database
      const listings = await this.databaseOpsService.getAllListedStorage();
      this.logger.log(`Found ${listings.length} marketplace listings`);
      listings.forEach((listing, i) => {
        this.logger.log(`  [${i}] ${listing.storageId.slice(0, 10)}... size=${listing.size} epochs=${listing.startEpoch}-${listing.endEpoch} price=${listing.totalPrice}`);
      });

      // 2. Convert Prisma ListedStorage to StorageObject format
      // Note: size and totalPrice are returned as strings from the DB service for JSON serialization
      const storageObjects: StorageObject[] = listings.map((listing) => ({
        id: listing.storageId,
        startEpoch: listing.startEpoch,
        endEpoch: listing.endEpoch,
        storageSize: BigInt(listing.size),
        price: BigInt(listing.totalPrice),
        owner: listing.seller,
      }));
      this.logger.log(`Converted to ${storageObjects.length} storage objects`);

      // 3. Create storage cost function using Walrus SDK
      const storageCostFn = async (
        sizeBytes: number,
        epochs: number,
      ): Promise<{ storageCost: bigint }> => {
        return await this.walrusService.storageCost(sizeBytes, epochs);
      };

      // 4. Initialize optimizer
      const optimizer = new WalrusStorageOptimizer(
        storageObjects,
        storageCostFn,
      );

      // 5. Create request
      const request: StorageRequest = {
        size,
        startEpoch,
        endEpoch,
      };

      // 6. Find optimal allocation
      const result: OptimizationResult =
        await optimizer.findOptimalAllocation(request);

      this.logger.log(
        `Optimization complete: ${result.allocations.length} allocations, total cost: ${result.totalCost}`,
      );

      // 7. Generate operations
      const operations = generateStorageOperations(
        result,
        startEpoch,
        endEpoch,
        size,
      );

      // 8. Calculate system-only price for comparison (frontend display)
      const epochs = endEpoch - startEpoch;
      const systemOnlyCost = await this.walrusService.storageCost(
        Number(size),
        epochs,
      );

      // 9. Convert to DTO format (BigInt → string for JSON serialization)
      return this.convertToDto(result, operations, systemOnlyCost.storageCost);
    } catch (error) {
      this.logger.error(`Optimization failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate PTB metadata for frontend transaction construction
   */
  private generatePTBMetadata(
    result: OptimizationResult,
    operations: any[],
  ): PTBMetadataDto {
    const paymentAmounts: string[] = [];
    const executionFlow: ExecutionFlowDto[] = [];
    let storageRefCounter = 0;
    let paymentIndex = 0;

    // Track which operations produce storage objects
    const storageProducers: Map<number, string> = new Map();

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];

      switch (op.type) {
        case 'buy_full_storage':
        case 'buy_partial_storage_size':
        case 'buy_partial_storage_epoch': {
          // Find the allocation that corresponds to this operation
          const allocation = result.allocations.find(
            (a) => a.storageObject.id === op.storageObjectId,
          );

          if (allocation) {
            // Add payment amount to the array
            paymentAmounts.push(allocation.sellerPayment.toString());

            const storageRef = `storage_${storageRefCounter++}`;
            storageProducers.set(i, storageRef);

            executionFlow.push({
              operationIndex: i,
              type: op.type,
              producesStorage: true,
              storageRef,
              paymentIndex: paymentIndex++,
              sellerAddress: allocation.seller,
            });
          }
          break;
        }

        case 'reserve_space': {
          // Add payment amount from the operation's cost
          paymentAmounts.push(op.cost.toString());

          const storageRef = `storage_${storageRefCounter++}`;
          storageProducers.set(i, storageRef);

          executionFlow.push({
            operationIndex: i,
            type: op.type,
            producesStorage: true,
            storageRef,
            paymentIndex: paymentIndex++,
          });
          break;
        }

        case 'split_by_size':
        case 'split_by_epoch': {
          // Split operations take input from the most recent storage-producing operation
          // Find the last operation that produced storage before this one
          let inputFromOperation: number | undefined;
          for (let j = i - 1; j >= 0; j--) {
            if (storageProducers.has(j)) {
              inputFromOperation = j;
              break;
            }
          }

          const storageRef = `storage_${storageRefCounter++}`;
          storageProducers.set(i, storageRef);

          executionFlow.push({
            operationIndex: i,
            type: op.type,
            producesStorage: true,
            storageRef,
            inputStorageFromOperation: inputFromOperation,
          });
          break;
        }

        case 'fuse_amount':
        case 'fuse_period': {
          // Fuse operations combine two storage objects
          // For proper tracking, we need to understand the grouping logic

          // Get all active storage-producing operations with their details
          const activeStorageOps: Array<{
            index: number;
            startEpoch: number;
            endEpoch: number;
            size: bigint;
          }> = [];

          for (let j = 0; j < i; j++) {
            if (storageProducers.has(j)) {
              const prevOp = operations[j];
              let startEpoch: number;
              let endEpoch: number;
              let size: bigint;

              // Determine epoch range and size based on operation type
              if (prevOp.type === 'reserve_space') {
                startEpoch = prevOp.startEpoch;
                endEpoch = prevOp.endEpoch;
                size = BigInt(prevOp.reserveSize);
              } else {
                // For buy operations, find the allocation
                const allocation = result.allocations.find(
                  (a) => a.storageObject.id === prevOp.storageObjectId,
                );
                if (allocation) {
                  startEpoch = allocation.usedStartEpoch;
                  endEpoch = allocation.usedEndEpoch;
                  size = allocation.usedSize;
                } else {
                  continue;
                }
              }

              activeStorageOps.push({
                index: j,
                startEpoch,
                endEpoch,
                size,
              });
            }
          }

          // Sort by start epoch
          activeStorageOps.sort((a, b) => a.startEpoch - b.startEpoch);

          let first: number;
          let second: number;

          if (op.type === 'fuse_amount') {
            // fuse_amount: Combine two pieces with SAME epoch range
            // Group by epoch range and find the group with multiple pieces
            const epochGroups = new Map<
              string,
              Array<{ index: number; startEpoch: number; endEpoch: number; size: bigint }>
            >();

            for (const storage of activeStorageOps) {
              const key = `${storage.startEpoch}-${storage.endEpoch}`;
              if (!epochGroups.has(key)) {
                epochGroups.set(key, []);
              }
              epochGroups.get(key)!.push(storage);
            }

            // Find a group with at least 2 pieces (for fuse_amount)
            let targetGroup: Array<{ index: number; startEpoch: number; endEpoch: number; size: bigint }> | undefined;
            for (const group of epochGroups.values()) {
              if (group.length >= 2) {
                targetGroup = group;
                break;
              }
            }

            if (targetGroup && targetGroup.length >= 2) {
              // Take the last two pieces from this group
              first = targetGroup[targetGroup.length - 2].index;
              second = targetGroup[targetGroup.length - 1].index;
            } else {
              // Fallback: just take last two overall (this shouldn't happen with correct generation)
              this.logger.warn(`fuse_amount at operation ${i}: no group with 2+ pieces found`);
              first = activeStorageOps[activeStorageOps.length - 2].index;
              second = activeStorageOps[activeStorageOps.length - 1].index;
            }
          } else {
            // fuse_period: Combine two pieces with ADJACENT epoch ranges and same size
            // The pieces should be from different epoch groups and adjacent
            // Ensure they are in the correct order for forward or backward fusion

            if (activeStorageOps.length < 2) {
              throw new Error(`fuse_period at operation ${i}: need at least 2 active storage pieces`);
            }

            // Get the last two pieces (sorted by start epoch)
            const piece1 = activeStorageOps[activeStorageOps.length - 2];
            const piece2 = activeStorageOps[activeStorageOps.length - 1];

            // Check adjacency and determine order
            // Forward fusion: piece1.end == piece2.start (piece1 is first, extends forward)
            // Backward fusion: piece1.start == piece2.end (piece2 is first, extends backward)
            if (piece1.endEpoch === piece2.startEpoch) {
              // Forward fusion: piece1 → piece2
              first = piece1.index;
              second = piece2.index;
            } else if (piece2.endEpoch === piece1.startEpoch) {
              // Backward fusion: piece2 → piece1
              first = piece2.index;
              second = piece1.index;
            } else {
              // Not adjacent - this shouldn't happen with correct generation
              this.logger.warn(`fuse_period at operation ${i}: pieces not adjacent (${piece1.startEpoch}-${piece1.endEpoch} and ${piece2.startEpoch}-${piece2.endEpoch})`);
              first = piece1.index;
              second = piece2.index;
            }
          }

          executionFlow.push({
            operationIndex: i,
            type: op.type,
            producesStorage: false, // Modifies first in-place
            fuseTargets: {
              first,
              second,
            },
          });

          // Remove the consumed storage from producers (second is consumed)
          storageProducers.delete(second);
          break;
        }

        default:
          this.logger.warn(`Unknown operation type: ${op.type}`);
      }
    }

    return {
      paymentAmounts,
      executionFlow,
    };
  }

  /**
   * Convert optimization result to DTO with BigInt → string conversion
   */
  private convertToDto(
    result: OptimizationResult,
    operations: any[],
    systemOnlyPrice: bigint,
  ): OptimizationResultDto {
    const operationsDto: StorageOperationDto[] = operations.map((op) => ({
      type: op.type,
      description: op.description,
      storageObjectId: op.storageObjectId,
      splitSize: op.splitSize?.toString(),
      splitStartEpoch: op.splitStartEpoch,
      splitEndEpoch: op.splitEndEpoch,
      splitEpoch: op.splitEpoch,
      reserveSize: op.reserveSize?.toString(),
      startEpoch: op.startEpoch,
      endEpoch: op.endEpoch,
      cost: op.cost?.toString(),
    }));

    const allocationsDto: AllocationDto[] = result.allocations.map((alloc) => ({
      storageObjectId: alloc.storageObject.id,
      usedSize: alloc.usedSize.toString(),
      usedStartEpoch: alloc.usedStartEpoch,
      usedEndEpoch: alloc.usedEndEpoch,
      cost: alloc.cost.toString(),
      sellerPayment: alloc.sellerPayment.toString(),
      seller: alloc.seller,
    }));

    const needsNewReservationDto: NewReservationDto | undefined =
      result.needsNewReservation
        ? {
            size: result.needsNewReservation.size.toString(),
            epochs: result.needsNewReservation.epochs,
            cost: result.needsNewReservation.cost.toString(),
          }
        : undefined;

    // Generate PTB metadata for frontend transaction construction
    const ptbMetadata = this.generatePTBMetadata(result, operations);

    return {
      operations: operationsDto,
      totalCost: result.totalCost.toString(),
      systemOnlyPrice: systemOnlyPrice.toString(),
      allocations: allocationsDto,
      needsNewReservation: needsNewReservationDto,
      ptbMetadata,
    };
  }
}
