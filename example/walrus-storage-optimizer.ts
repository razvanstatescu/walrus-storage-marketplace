// Types and Interfaces
export interface StorageObject {
  id: string;
  startEpoch: number;
  endEpoch: number;
  storageSize: bigint; // in bytes
  price: bigint; // total price for this storage object
  owner?: string; // seller address
}

export interface StorageRequest {
  size: bigint; // bytes needed
  startEpoch: number;
  endEpoch: number;
}

export interface StorageAllocation {
  storageObject: StorageObject;
  usedSize: bigint;
  usedStartEpoch: number;
  usedEndEpoch: number;
  cost: bigint;
  sellerPayment: bigint; // pro-rated payment to the seller for the portion used
  seller?: string; // seller address (owner of the storage object)
}

export interface OptimizationResult {
  allocations: StorageAllocation[];
  totalCost: bigint;
  needsNewReservation?: {
    size: bigint;
    epochs: number;
    cost: bigint;
  };
}

// Helper functions
function calculateProRatedPrice(
  storage: StorageObject,
  usedSize: bigint,
  usedStartEpoch: number,
  usedEndEpoch: number
): bigint {
  const totalEpochs = storage.endEpoch - storage.startEpoch;
  const usedEpochs = usedEndEpoch - usedStartEpoch;
  const sizeRatio = usedSize * 1000n / storage.storageSize; // Use fixed point math
  const epochRatio = BigInt(usedEpochs * 1000) / BigInt(totalEpochs);

  return (storage.price * sizeRatio * epochRatio) / 1000000n;
}

function overlapsWithRequest(storage: StorageObject, request: StorageRequest): boolean {
  return storage.startEpoch < request.endEpoch && storage.endEpoch > request.startEpoch;
}

function getOverlapPeriod(
  storage: StorageObject,
  request: StorageRequest
): { start: number; end: number } {
  return {
    start: Math.max(storage.startEpoch, request.startEpoch),
    end: Math.min(storage.endEpoch, request.endEpoch)
  };
}

// Main optimization algorithm
export class WalrusStorageOptimizer {
  private storageObjects: StorageObject[];
  private storageCostFn: (size: number, epochs: number) => Promise<{ storageCost: bigint }>;

  constructor(
    storageObjects: StorageObject[],
    storageCostFn: (size: number, epochs: number) => Promise<{ storageCost: bigint }>
  ) {
    this.storageObjects = storageObjects;
    this.storageCostFn = storageCostFn;
  }

  /**
   * Find the optimal combination of storage objects to fulfill a storage request
   * Compares 4 strategies: greedy, DP, hybrid, and reserve-only
   */
  async findOptimalAllocation(request: StorageRequest): Promise<OptimizationResult> {
    // Filter storage objects that overlap with the requested period
    const availableStorage = this.storageObjects.filter(s => overlapsWithRequest(s, request));

    // Always include reserve-only strategy for comparison
    const reserveOnlyStrategy = this.createNewReservation(request);

    if (availableStorage.length === 0) {
      // No existing storage available, use reserve-only
      return reserveOnlyStrategy;
    }

    // Try all strategies including reserve-only
    const strategies = await Promise.all([
      this.greedyAllocation(request, availableStorage),
      this.dynamicProgrammingAllocation(request, availableStorage),
      this.hybridAllocation(request, availableStorage),
      reserveOnlyStrategy  // Always compare with buying fresh from system
    ]);

    // Return the strategy with the lowest cost
    return strategies.reduce((best, current) =>
      current.totalCost < best.totalCost ? current : best
    );
  }

  /**
   * Greedy algorithm: Select storage objects with the best price per unit
   */
  private async greedyAllocation(
    request: StorageRequest,
    availableStorage: StorageObject[]
  ): Promise<OptimizationResult> {
    const allocations: StorageAllocation[] = [];
    let remainingSize = request.size;

    // Sort by price efficiency (price per byte per epoch in the overlap period)
    const sortedStorage = [...availableStorage].sort((a, b) => {
      const overlapA = getOverlapPeriod(a, request);
      const overlapB = getOverlapPeriod(b, request);

      const epochsA = overlapA.end - overlapA.start;
      const epochsB = overlapB.end - overlapB.start;

      // Use cross multiplication to avoid bigint division precision loss
      // a.price / (a.storageSize * epochsA) < b.price / (b.storageSize * epochsB)
      // becomes: a.price * b.storageSize * epochsB < b.price * a.storageSize * epochsA
      const leftSide = a.price * b.storageSize * BigInt(epochsB);
      const rightSide = b.price * a.storageSize * BigInt(epochsA);

      return leftSide < rightSide ? -1 : leftSide > rightSide ? 1 : 0;
    });

    for (const storage of sortedStorage) {
      if (remainingSize <= 0n) break;

      const overlap = getOverlapPeriod(storage, request);
      const usedSize = storage.storageSize < remainingSize ? storage.storageSize : remainingSize;
      const cost = calculateProRatedPrice(storage, usedSize, overlap.start, overlap.end);

      // Compare cost of using this object vs reserving remaining space from system
      const epochs = request.endEpoch - request.startEpoch;
      const reserveCostForRemaining = await this.storageCostFn(Number(remainingSize), epochs);

      // If reserving is cheaper than using this object, stop using DB objects
      if (reserveCostForRemaining.storageCost < cost) {
        break;
      }

      allocations.push({
        storageObject: storage,
        usedSize,
        usedStartEpoch: overlap.start,
        usedEndEpoch: overlap.end,
        cost,
        sellerPayment: cost, // The calculated cost IS the seller's payment
        seller: storage.owner
      });

      remainingSize -= usedSize;
    }

    // If we still need more storage, calculate the cost of new reservation
    let needsNewReservation = undefined;
    if (remainingSize > 0n) {
      const epochs = request.endEpoch - request.startEpoch;
      const cost = await this.storageCostFn(Number(remainingSize), epochs);
      needsNewReservation = {
        size: remainingSize,
        epochs,
        cost: cost.storageCost
      };
    }

    const totalCost = allocations.reduce((sum, a) => sum + a.cost, 0n) +
      (needsNewReservation?.cost || 0n);

    return { allocations, totalCost, needsNewReservation };
  }

  /**
   * Dynamic Programming approach for optimal subset selection
   * Uses KB units to reduce computational complexity
   */
  private async dynamicProgrammingAllocation(
    request: StorageRequest,
    availableStorage: StorageObject[]
  ): Promise<OptimizationResult> {
    // Convert bytes to KB for DP calculations (reduces iterations by 1024x)
    const BYTES_TO_KB = 1024;
    const targetSizeKB = Math.ceil(Number(request.size) / BYTES_TO_KB);
    const n = availableStorage.length;

    // Create DP table: dp[i][size] = minimum cost to achieve 'size' using first i objects
    const dp: Map<string, { cost: bigint; allocations: StorageAllocation[] }> = new Map();

    // Initialize base case
    dp.set('0,0', { cost: 0n, allocations: [] });

    // Fill DP table
    for (let i = 1; i <= n; i++) {
      const storage = availableStorage[i - 1];
      const overlap = getOverlapPeriod(storage, request);
      const maxUsableSizeKB = Math.floor(Number(storage.storageSize) / BYTES_TO_KB);

      for (let sizeKB = 0; sizeKB <= targetSizeKB; sizeKB++) {
        // Option 1: Don't use this storage object
        const prevKey = `${i - 1},${sizeKB}`;
        if (dp.has(prevKey)) {
          const prev = dp.get(prevKey)!;
          dp.set(`${i},${sizeKB}`, prev);
        }

        // Option 2: Use part or all of this storage object
        for (let useSizeKB = 1; useSizeKB <= Math.min(maxUsableSizeKB, sizeKB); useSizeKB++) {
          const remainingSizeKB = sizeKB - useSizeKB;
          const prevKey = `${i - 1},${remainingSizeKB}`;

          if (dp.has(prevKey)) {
            const prev = dp.get(prevKey)!;
            // Convert KB back to bytes for cost calculation
            const usedSizeBytes = BigInt(useSizeKB * BYTES_TO_KB);
            const cost = calculateProRatedPrice(storage, usedSizeBytes, overlap.start, overlap.end);
            const totalCost = prev.cost + cost;

            const currentKey = `${i},${sizeKB}`;
            if (!dp.has(currentKey) || dp.get(currentKey)!.cost > totalCost) {
              dp.set(currentKey, {
                cost: totalCost,
                allocations: [
                  ...prev.allocations,
                  {
                    storageObject: storage,
                    usedSize: usedSizeBytes,
                    usedStartEpoch: overlap.start,
                    usedEndEpoch: overlap.end,
                    cost,
                    sellerPayment: cost, // The calculated cost IS the seller's payment
                    seller: storage.owner
                  }
                ]
              });
            }
          }
        }
      }
    }

    // Get the best solution
    let bestResult: OptimizationResult | null = null;

    // Check if we found a complete solution
    const completeKey = `${n},${targetSizeKB}`;
    if (dp.has(completeKey)) {
      const result = dp.get(completeKey)!;
      bestResult = {
        allocations: result.allocations,
        totalCost: result.cost
      };
    } else {
      // Find the best partial solution and add new reservation for the rest
      let bestPartial = { cost: BigInt(Number.MAX_SAFE_INTEGER), allocations: [], size: 0 };

      for (let sizeKB = 0; sizeKB < targetSizeKB; sizeKB++) {
        const key = `${n},${sizeKB}`;
        if (dp.has(key)) {
          const result = dp.get(key)!;
          if (result.cost < bestPartial.cost) {
            bestPartial = { ...result, size: sizeKB };
          }
        }
      }

      // Convert KB back to bytes for remaining size
      const allocatedBytes = bestPartial.allocations.reduce((sum, a) => sum + a.usedSize, 0n);
      const remainingSize = request.size - allocatedBytes;
      const epochs = request.endEpoch - request.startEpoch;
      const newReservationCost = await this.storageCostFn(Number(remainingSize), epochs);

      bestResult = {
        allocations: bestPartial.allocations,
        totalCost: bestPartial.cost + newReservationCost.storageCost,
        needsNewReservation: {
          size: remainingSize,
          epochs,
          cost: newReservationCost.storageCost
        }
      };
    }

    return bestResult || this.createNewReservation(request);
  }

  /**
   * Hybrid approach: Combine greedy for large chunks and DP for optimization
   */
  private async hybridAllocation(
    request: StorageRequest,
    availableStorage: StorageObject[]
  ): Promise<OptimizationResult> {
    // First, identify storage objects that cover the entire period
    const fullPeriodStorage = availableStorage.filter(s =>
      s.startEpoch <= request.startEpoch && s.endEpoch >= request.endEpoch
    );

    // Use greedy for large chunks that cover the full period
    const greedyAllocations: StorageAllocation[] = [];
    let remainingSize = request.size;

    if (fullPeriodStorage.length > 0) {
      // Sort by price per byte
      fullPeriodStorage.sort((a, b) => {
        const pricePerByteA = a.price / a.storageSize;
        const pricePerByteB = b.price / b.storageSize;
        return pricePerByteA < pricePerByteB ? -1 : 1;
      });

      for (const storage of fullPeriodStorage) {
        if (remainingSize <= 0n) break;

        const usedSize = storage.storageSize < remainingSize ? storage.storageSize : remainingSize;
        const cost = calculateProRatedPrice(storage, usedSize, request.startEpoch, request.endEpoch);
        greedyAllocations.push({
          storageObject: storage,
          usedSize,
          usedStartEpoch: request.startEpoch,
          usedEndEpoch: request.endEpoch,
          cost,
          sellerPayment: cost, // The calculated cost IS the seller's payment
          seller: storage.owner
        });

        remainingSize -= usedSize;
      }
    }

    // If we still need storage, use DP for the remaining partial period storage
    if (remainingSize > 0n) {
      const partialStorage = availableStorage.filter(s =>
        !fullPeriodStorage.includes(s) && overlapsWithRequest(s, request)
      );

      if (partialStorage.length > 0) {
        const partialRequest: StorageRequest = {
          ...request,
          size: remainingSize
        };

        const dpResult = await this.dynamicProgrammingAllocation(partialRequest, partialStorage);
        greedyAllocations.push(...dpResult.allocations);

        const totalCost = greedyAllocations.reduce((sum, a) => sum + a.cost, 0n);

        return {
          allocations: greedyAllocations,
          totalCost: totalCost + (dpResult.needsNewReservation?.cost || 0n),
          needsNewReservation: dpResult.needsNewReservation
        };
      }
    }

    const totalCost = greedyAllocations.reduce((sum, a) => sum + a.cost, 0n);

    // Check if we need new reservation for remaining size
    if (remainingSize > 0n) {
      const epochs = request.endEpoch - request.startEpoch;
      const newReservationCost = await this.storageCostFn(Number(remainingSize), epochs);

      return {
        allocations: greedyAllocations,
        totalCost: totalCost + newReservationCost.storageCost,
        needsNewReservation: {
          size: remainingSize,
          epochs,
          cost: newReservationCost.storageCost
        }
      };
    }

    return {
      allocations: greedyAllocations,
      totalCost
    };
  }

  /**
   * Create a new reservation when no existing storage is available
   */
  private async createNewReservation(request: StorageRequest): Promise<OptimizationResult> {
    const epochs = request.endEpoch - request.startEpoch;
    const cost = await this.storageCostFn(Number(request.size), epochs);

    return {
      allocations: [],
      totalCost: cost.storageCost,
      needsNewReservation: {
        size: request.size,
        epochs,
        cost: cost.storageCost
      }
    };
  }
}

export interface StorageOperation {
  type: 'pay_seller' | 'split_by_epoch' | 'split_by_size' | 'reserve_space' | 'fuse' | 'fuse_amount' | 'fuse_periods';
  description: string;
  resultId?: string;
  seller?: string; // seller address for pay_seller operations
  amount?: bigint; // payment amount for pay_seller operations
}

// Export function for generating the operations needed to create a single Storage object
export function generateStorageOperations(
  result: OptimizationResult,
  requestStartEpoch: number,
  requestEndEpoch: number,
  requestSize: bigint
): StorageOperation[] {
  const operations: StorageOperation[] = [];
  const objectIds: string[] = [];
  let operationCounter = 0;

  // Step 0: Add payment operations for sellers
  for (const allocation of result.allocations) {
    if (allocation.seller && allocation.sellerPayment > 0n) {
      operations.push({
        type: 'pay_seller',
        description: `pay_seller(${allocation.seller}, ${allocation.sellerPayment} FROST) → payment for ${Number(allocation.usedSize) / (1024 * 1024)}MB from epochs ${allocation.usedStartEpoch}-${allocation.usedEndEpoch}`,
        seller: allocation.seller,
        amount: allocation.sellerPayment
      });
    }
  }

  // Step 1: Process each allocation - split to extract the exact portion needed
  for (let i = 0; i < result.allocations.length; i++) {
    const allocation = result.allocations[i];
    const storage = allocation.storageObject;
    let currentId = storage.id;

    // Split by epoch if needed (start)
    if (allocation.usedStartEpoch > storage.startEpoch) {
      const newId = `${storage.id}_split_${++operationCounter}`;
      operations.push({
        type: 'split_by_epoch',
        description: `split_by_epoch(${currentId}, ${allocation.usedStartEpoch}) → returns ${newId} (epochs ${allocation.usedStartEpoch}-${storage.endEpoch})`,
        resultId: newId
      });
      currentId = newId;
    }

    // Split by epoch if needed (end)
    if (allocation.usedEndEpoch < storage.endEpoch) {
      const newId = `${storage.id}_split_${++operationCounter}`;
      operations.push({
        type: 'split_by_epoch',
        description: `split_by_epoch(${currentId}, ${allocation.usedEndEpoch}) → returns ${newId} (epochs ${allocation.usedEndEpoch}-${storage.endEpoch})`,
        resultId: newId
      });
      // currentId remains the same as the original is modified to be start-split_epoch
    }

    // Split by size if needed
    if (allocation.usedSize < storage.storageSize) {
      const newId = `${storage.id}_split_${++operationCounter}`;
      operations.push({
        type: 'split_by_size',
        description: `split_by_size(${currentId}, ${allocation.usedSize}) → returns ${newId} (size: ${storage.storageSize - allocation.usedSize} bytes)`,
        resultId: newId
      });
      // currentId remains the same as the original is modified to have split_size
    }

    // Track the final object ID for this allocation
    objectIds.push(currentId);
  }

  // Step 2: Reserve new storage if needed
  if (result.needsNewReservation) {
    const reservedId = `reserved_storage_${++operationCounter}`;
    operations.push({
      type: 'reserve_space',
      description: `reserve_space(size: ${result.needsNewReservation.size} bytes, epochs: ${result.needsNewReservation.epochs}) → ${reservedId}`,
      resultId: reservedId
    });
    objectIds.push(reservedId);
  }

  // Step 3: Fuse all objects into a single Storage object
  if (objectIds.length > 1) {
    // Sort allocations to determine fusion strategy
    const sortedAllocations = [...result.allocations].sort((a, b) => a.usedStartEpoch - b.usedStartEpoch);

    // Determine if we can fuse by periods or need to fuse by amount
    const sameEpochRange = sortedAllocations.every(
      a => a.usedStartEpoch === requestStartEpoch && a.usedEndEpoch === requestEndEpoch
    );

    if (sameEpochRange) {
      // All objects cover the same period - fuse by amount (size)
      let mainId = objectIds[0];
      for (let i = 1; i < objectIds.length; i++) {
        operations.push({
          type: 'fuse_amount',
          description: `fuse_amount(${mainId}, ${objectIds[i]}) → combines storage amounts into ${mainId}`,
          resultId: mainId
        });
      }
      operations.push({
        type: 'fuse',
        description: `✓ Final Storage object: ${mainId} (size: ${requestSize} bytes, epochs: ${requestStartEpoch}-${requestEndEpoch}, cost: ${result.totalCost} FROST)`
      });
    } else {
      // Objects cover different periods - need complex fusion
      // First, fuse objects with same size but adjacent periods
      let mainId = objectIds[0];
      for (let i = 1; i < objectIds.length; i++) {
        operations.push({
          type: 'fuse',
          description: `fuse(${mainId}, ${objectIds[i]}) → merges into ${mainId}`,
          resultId: mainId
        });
      }
      operations.push({
        type: 'fuse',
        description: `✓ Final Storage object: ${mainId} (size: ${requestSize} bytes, epochs: ${requestStartEpoch}-${requestEndEpoch}, cost: ${result.totalCost} FROST)`
      });
    }
  } else if (objectIds.length === 1) {
    operations.push({
      type: 'fuse',
      description: `✓ Final Storage object: ${objectIds[0]} (size: ${requestSize} bytes, epochs: ${requestStartEpoch}-${requestEndEpoch}, cost: ${result.totalCost} FROST)`
    });
  }

  return operations;
}
