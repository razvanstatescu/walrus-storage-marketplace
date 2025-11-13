import { Injectable, Logger } from '@nestjs/common';
import { DatabaseOperationsService } from '../sui-indexer/services/database-operations.service';
import { WalrusService } from '../walrus/walrus.service';
import {
  WalrusStorageOptimizer,
  StorageObject,
  StorageRequest,
  OptimizationResult,
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

      // 2. Convert Prisma ListedStorage to StorageObject format
      const storageObjects: StorageObject[] = listings.map((listing) => ({
        id: listing.storageId,
        startEpoch: listing.startEpoch,
        endEpoch: listing.endEpoch,
        storageSize: BigInt(listing.size),
        price: BigInt(listing.totalPrice),
        pricePerSizePerEpoch: BigInt(listing.pricePerSizePerEpoch),
        owner: listing.seller,
      }));

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

      // 7. Generate simplified operations
      const operations = this.generateStorageOperations(result);

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
   * SIMPLIFIED: Generate storage operations
   *
   * Strategy:
   * 1. Buy storage pieces (full or partial size)
   * 2. Reserve from system if needed
   * 3. Fuse all pieces together if multiple
   *
   * Only uses 4 operation types:
   * - buy_full_storage
   * - buy_partial_storage_size
   * - reserve_space
   * - fuse_amount
   */
  private generateStorageOperations(
    result: OptimizationResult,
  ): any[] {
    const operations: any[] = [];

    // Step 1: Buy storage pieces from marketplace
    for (const allocation of result.allocations) {
      const storage = allocation.storageObject;

      if (allocation.usedSize === storage.storageSize) {
        // Buy the full storage object
        operations.push({
          type: 'buy_full_storage',
          storageObjectId: storage.id,
          description: `Buy full storage (${storage.storageSize} bytes)`,
        });
      } else {
        // Buy partial size (marketplace keeps the remainder)
        operations.push({
          type: 'buy_partial_storage_size',
          storageObjectId: storage.id,
          splitSize: allocation.usedSize,
          description: `Buy ${allocation.usedSize} bytes from ${storage.id.slice(0, 10)}...`,
        });
      }
    }

    // Step 2: Reserve new storage from system if needed
    if (result.needsNewReservation) {
      operations.push({
        type: 'reserve_space',
        reserveSize: result.needsNewReservation.size,
        startEpoch: result.needsNewReservation.startEpoch,
        endEpoch: result.needsNewReservation.endEpoch,
        cost: result.needsNewReservation.cost,
        description: `Reserve ${result.needsNewReservation.size} bytes from system`,
      });
    }

    // Step 3: Fuse all pieces if we have multiple
    const totalPieces =
      result.allocations.length + (result.needsNewReservation ? 1 : 0);

    if (totalPieces > 1) {
      // All pieces have SAME epoch range (by design), so use fuse_amount
      // Fuse all pieces into the first one
      for (let i = 1; i < totalPieces; i++) {
        operations.push({
          type: 'fuse_amount',
          description: `Fuse piece ${i} into piece 0`,
        });
      }
    }

    this.logger.log(`Generated ${operations.length} operations`);
    return operations;
  }

  /**
   * SIMPLIFIED: Generate PTB metadata for frontend transaction construction
   *
   * Handles only 4 operation types:
   * - buy_full_storage / buy_partial_storage_size
   * - reserve_space
   * - fuse_amount
   */
  private generatePTBMetadata(
    result: OptimizationResult,
    operations: any[],
  ): PTBMetadataDto {
    const paymentAmounts: string[] = [];
    const executionFlow: ExecutionFlowDto[] = [];
    let paymentIndex = 0;

    // Total number of storage-producing operations
    const totalPieces =
      result.allocations.length + (result.needsNewReservation ? 1 : 0);

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];

      if (op.type === 'buy_full_storage' || op.type === 'buy_partial_storage_size') {
        // Find the allocation that corresponds to this operation
        const allocation = result.allocations.find(
          (a) => a.storageObject.id === op.storageObjectId,
        );

        if (allocation) {
          // For buy_full_storage, use the full storage object's total price
          // For partial purchases, use the pro-rated seller payment
          const paymentAmount =
            op.type === 'buy_full_storage'
              ? allocation.storageObject.price.toString()
              : allocation.sellerPayment.toString();

          paymentAmounts.push(paymentAmount);

          executionFlow.push({
            operationIndex: i,
            type: op.type,
            producesStorage: true,
            storageRef: `storage_${i}`,
            paymentIndex: paymentIndex++,
            sellerAddress: allocation.seller,
          });
        }
      } else if (op.type === 'reserve_space') {
        // Add payment amount from the operation's cost
        paymentAmounts.push(op.cost.toString());

        executionFlow.push({
          operationIndex: i,
          type: op.type,
          producesStorage: true,
          storageRef: `storage_${i}`,
          paymentIndex: paymentIndex++,
        });
      } else if (op.type === 'fuse_amount') {
        // Fuse operations: always fuse into first piece (storage_0)
        // The second piece index is: current_operation_index - (total_operations - total_pieces)
        // This gives us which storage-producing operation created the piece to fuse

        // Calculate which piece we're fusing
        // If we have 3 pieces and 5 total operations (3 buys/reserves + 2 fuses):
        // - Operation 3 (first fuse): fuses piece 1 into piece 0
        // - Operation 4 (second fuse): fuses piece 2 into piece 0
        const fuseIndex = i - totalPieces + 1;

        executionFlow.push({
          operationIndex: i,
          type: op.type,
          producesStorage: false,
          fuseTargets: {
            first: 0, // Always fuse into the first piece
            second: fuseIndex,
          },
        });
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
      reserveSize: op.reserveSize?.toString(),
      startEpoch: op.startEpoch,
      endEpoch: op.endEpoch,
      cost: op.cost?.toString(),
    }));

    const allocationsDto: AllocationDto[] = result.allocations.map(
      (alloc) => ({
        storageObjectId: alloc.storageObject.id,
        usedSize: alloc.usedSize.toString(),
        usedStartEpoch: alloc.usedStartEpoch,
        usedEndEpoch: alloc.usedEndEpoch,
        cost: alloc.cost.toString(),
        sellerPayment: alloc.sellerPayment.toString(),
        seller: alloc.seller,
      }),
    );

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
