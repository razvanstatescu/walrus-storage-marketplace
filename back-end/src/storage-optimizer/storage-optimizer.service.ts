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
      const storageObjects: StorageObject[] = listings.map((listing) => ({
        id: listing.storageId,
        startEpoch: listing.startEpoch,
        endEpoch: listing.endEpoch,
        storageSize: listing.size,
        price: listing.totalPrice,
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

    return {
      operations: operationsDto,
      totalCost: result.totalCost.toString(),
      systemOnlyPrice: systemOnlyPrice.toString(),
      allocations: allocationsDto,
      needsNewReservation: needsNewReservationDto,
    };
  }
}
