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

  // Avoid precision loss by multiplying first, then dividing once
  // Formula: (price * usedSize * usedEpochs) / (storageSize * totalEpochs)
  const numerator = storage.price * usedSize * BigInt(usedEpochs);
  const denominator = storage.storageSize * BigInt(totalEpochs);

  return numerator / denominator;
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

/**
 * Verify if allocations cover the full requested epoch range
 * Returns any gaps in epoch coverage that need to be filled
 */
function verifyEpochCoverage(
  allocations: StorageAllocation[],
  request: StorageRequest
): Array<{ start: number; end: number }> {
  if (allocations.length === 0) {
    // No allocations - entire range is a gap
    return [{ start: request.startEpoch, end: request.endEpoch }];
  }

  // Sort allocations by start epoch
  const sorted = [...allocations].sort((a, b) => a.usedStartEpoch - b.usedStartEpoch);

  const gaps: Array<{ start: number; end: number }> = [];

  // Check if there's a gap before the first allocation
  if (sorted[0].usedStartEpoch > request.startEpoch) {
    gaps.push({
      start: request.startEpoch,
      end: sorted[0].usedStartEpoch
    });
  }

  // Check for gaps between allocations
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = sorted[i].usedEndEpoch;
    const nextStart = sorted[i + 1].usedStartEpoch;

    if (currentEnd < nextStart) {
      gaps.push({ start: currentEnd, end: nextStart });
    }
  }

  // Check if there's a gap after the last allocation
  const lastAllocation = sorted[sorted.length - 1];
  if (lastAllocation.usedEndEpoch < request.endEpoch) {
    gaps.push({
      start: lastAllocation.usedEndEpoch,
      end: request.endEpoch
    });
  }

  return gaps;
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
    console.log(`\n[OPTIMIZER] findOptimalAllocation called`);
    console.log(`  Request: size=${request.size} epochs=${request.startEpoch}-${request.endEpoch}`);
    console.log(`  Available storage objects: ${this.storageObjects.length}`);

    // Filter storage objects that overlap with the requested period
    const availableStorage = this.storageObjects.filter(s => overlapsWithRequest(s, request));
    console.log(`  After overlap filter: ${availableStorage.length} objects`);
    availableStorage.forEach((s, i) => {
      console.log(`    [${i}] size=${s.storageSize} epochs=${s.startEpoch}-${s.endEpoch} price=${s.price}`);
    });

    // Always include reserve-only strategy for comparison
    const reserveOnlyStrategy = await this.createNewReservation(request);
    console.log(`  Reserve-only cost: ${reserveOnlyStrategy.totalCost}`);

    if (availableStorage.length === 0) {
      console.log(`  No available storage, using reserve-only`);
      // No existing storage available, use reserve-only
      return reserveOnlyStrategy;
    }

    // Try all strategies including reserve-only
    console.log(`  Running all strategies...`);
    const strategies = await Promise.all([
      this.greedyAllocation(request, availableStorage),
      this.dynamicProgrammingAllocation(request, availableStorage),
      this.hybridAllocation(request, availableStorage),
      reserveOnlyStrategy  // Always compare with buying fresh from system
    ]);

    console.log(`  Strategy costs:`);
    console.log(`    Greedy: ${strategies[0].totalCost} (${strategies[0].allocations.length} allocations)`);
    console.log(`    DP: ${strategies[1].totalCost} (${strategies[1].allocations.length} allocations)`);
    console.log(`    Hybrid: ${strategies[2].totalCost} (${strategies[2].allocations.length} allocations)`);
    console.log(`    Reserve-only: ${strategies[3].totalCost}`);

    // Return the strategy with the lowest cost
    const best = strategies.reduce((best, current) =>
      current.totalCost < best.totalCost ? current : best
    );
    console.log(`  Best strategy: cost=${best.totalCost}, allocations=${best.allocations.length}\n`);
    return best;
  }

  /**
   * Greedy algorithm: Select storage objects with the best price per unit
   */
  private async greedyAllocation(
    request: StorageRequest,
    availableStorage: StorageObject[]
  ): Promise<OptimizationResult> {
    console.log(`\n  [GREEDY] Starting greedy allocation`);
    const allocations: StorageAllocation[] = [];
    let remainingSize = request.size;
    console.log(`    Initial remaining size: ${remainingSize}`);

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

      // Compare cost of using this object vs reserving the SAME SIZE from system
      const epochs = request.endEpoch - request.startEpoch;
      const reserveCostForThisSize = await this.storageCostFn(Number(usedSize), epochs);

      console.log(`    Considering: size=${storage.storageSize}, usedSize=${usedSize}`);
      console.log(`      Marketplace cost: ${cost}`);
      console.log(`      System cost (same size): ${reserveCostForThisSize.storageCost}`);

      // If reserving this specific size is cheaper than using marketplace, stop using DB objects
      if (reserveCostForThisSize.storageCost < cost) {
        console.log(`      -> System cheaper, breaking`);
        break;
      }

      console.log(`      -> Marketplace cheaper, adding allocation`);
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
      console.log(`      Remaining size: ${remainingSize}`);
    }

    // Check for epoch coverage gaps
    const epochGaps = verifyEpochCoverage(allocations, request);
    console.log(`    Epoch coverage gaps: ${epochGaps.length}`);
    epochGaps.forEach((gap, i) => {
      console.log(`      Gap ${i}: epochs ${gap.start}-${gap.end}`);
    });

    // Calculate reservations needed for remaining size OR epoch gaps
    let needsNewReservation: { size: bigint; epochs: number; cost: bigint } | undefined = undefined;
    let additionalCost = 0n;

    // Case 1: We have remaining size that needs to be allocated
    if (remainingSize > 0n) {
      const epochs = request.endEpoch - request.startEpoch;
      const cost = await this.storageCostFn(Number(remainingSize), epochs);
      needsNewReservation = {
        size: remainingSize,
        epochs,
        cost: cost.storageCost
      };
      console.log(`    Need new reservation for remaining size: ${remainingSize} bytes, cost: ${cost.storageCost}`);
    }
    // Case 2: Size is covered, but epoch range has gaps
    else if (epochGaps.length > 0) {
      // We need to reserve the full request size for the uncovered epoch periods
      // Calculate total cost for all gaps
      for (const gap of epochGaps) {
        const gapEpochs = gap.end - gap.start;
        const gapCost = await this.storageCostFn(Number(request.size), gapEpochs);
        additionalCost += gapCost.storageCost;
        console.log(`      Gap ${gap.start}-${gap.end}: ${gapEpochs} epochs, cost: ${gapCost.storageCost}`);
      }

      // For simplicity, combine all gaps into one "new reservation" entry
      // In practice, this would be multiple reserve_space operations
      const totalGapEpochs = epochGaps.reduce((sum, gap) => sum + (gap.end - gap.start), 0);
      needsNewReservation = {
        size: request.size,
        epochs: totalGapEpochs,
        cost: additionalCost
      };
      console.log(`    Need new reservation for epoch gaps: ${request.size} bytes for ${totalGapEpochs} total epochs, cost: ${additionalCost}`);
    }

    const totalCost = allocations.reduce((sum, a) => sum + a.cost, 0n) +
      (needsNewReservation?.cost || 0n);

    console.log(`    Final total cost: ${totalCost}`);

    return { allocations, totalCost, needsNewReservation };
  }

  /**
   * Dynamic Programming approach for optimal subset selection
   * OPTIMIZATION: Uses adaptive granularity based on request size
   * - Small requests (<1 GiB): Use KB units
   * - Large requests (>=1 GiB): Use MiB units
   * - Very large requests (>=10 GiB): Skip DP, use greedy only
   */
  private async dynamicProgrammingAllocation(
    request: StorageRequest,
    availableStorage: StorageObject[]
  ): Promise<OptimizationResult> {
    const ONE_GIB = 1024 * 1024 * 1024;
    const TEN_GIB = 10 * ONE_GIB;

    // OPTIMIZATION 1: For very large requests (>=10 GiB), skip DP entirely
    // DP becomes too slow, use greedy algorithm instead
    if (Number(request.size) >= TEN_GIB) {
      console.log(`[DP] Request too large (${Number(request.size)} bytes), using greedy instead`);
      return this.greedyAllocation(request, availableStorage);
    }

    // OPTIMIZATION 2: Use adaptive granularity
    // Small requests: KB units, Large requests: MiB units
    const UNIT_SIZE = Number(request.size) >= ONE_GIB
      ? 1024 * 1024  // MiB for large requests
      : 1024;         // KB for small requests

    const targetSizeUnits = Math.ceil(Number(request.size) / UNIT_SIZE);
    const n = availableStorage.length;

    // OPTIMIZATION 3: Add complexity limit
    // If DP table would be too large, fall back to greedy
    const MAX_DP_ITERATIONS = 100_000_000; // 100M iterations max
    const estimatedIterations = n * targetSizeUnits * (targetSizeUnits / 2);

    if (estimatedIterations > MAX_DP_ITERATIONS) {
      console.log(`[DP] Estimated iterations (${estimatedIterations}) exceeds limit, using greedy instead`);
      return this.greedyAllocation(request, availableStorage);
    }

    console.log(`[DP] Using ${UNIT_SIZE === 1024 ? 'KB' : 'MiB'} units, target=${targetSizeUnits}, iterations≈${estimatedIterations.toLocaleString()}`);

    // Create DP table: dp[i][size] = minimum cost to achieve 'size' using first i objects
    const dp: Map<string, { cost: bigint; allocations: StorageAllocation[] }> = new Map();

    // Initialize base case
    dp.set('0,0', { cost: 0n, allocations: [] });

    // Fill DP table
    for (let i = 1; i <= n; i++) {
      const storage = availableStorage[i - 1];
      const overlap = getOverlapPeriod(storage, request);
      const maxUsableSizeUnits = Math.floor(Number(storage.storageSize) / UNIT_SIZE);

      for (let sizeUnits = 0; sizeUnits <= targetSizeUnits; sizeUnits++) {
        // Option 1: Don't use this storage object
        const prevKey = `${i - 1},${sizeUnits}`;
        if (dp.has(prevKey)) {
          const prev = dp.get(prevKey)!;
          dp.set(`${i},${sizeUnits}`, prev);
        }

        // Option 2: Use part or all of this storage object
        for (let useSizeUnits = 1; useSizeUnits <= Math.min(maxUsableSizeUnits, sizeUnits); useSizeUnits++) {
          const remainingSizeUnits = sizeUnits - useSizeUnits;
          const prevKey = `${i - 1},${remainingSizeUnits}`;

          if (dp.has(prevKey)) {
            const prev = dp.get(prevKey)!;
            // Convert units back to bytes for cost calculation
            const usedSizeBytes = BigInt(useSizeUnits * UNIT_SIZE);
            const cost = calculateProRatedPrice(storage, usedSizeBytes, overlap.start, overlap.end);
            const totalCost = prev.cost + cost;

            const currentKey = `${i},${sizeUnits}`;
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
    const completeKey = `${n},${targetSizeUnits}`;
    if (dp.has(completeKey)) {
      const result = dp.get(completeKey)!;
      bestResult = {
        allocations: result.allocations,
        totalCost: result.cost
      };
    } else {
      // Find the best partial solution and add new reservation for the rest
      let bestPartial: { cost: bigint; allocations: StorageAllocation[]; size: number } = {
        cost: BigInt(Number.MAX_SAFE_INTEGER),
        allocations: [],
        size: 0
      };

      for (let sizeUnits = 0; sizeUnits < targetSizeUnits; sizeUnits++) {
        const key = `${n},${sizeUnits}`;
        if (dp.has(key)) {
          const result = dp.get(key)!;
          if (result.cost < bestPartial.cost) {
            bestPartial = { ...result, size: sizeUnits };
          }
        }
      }

      // Convert units back to bytes for remaining size
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

    if (!bestResult) {
      return this.createNewReservation(request);
    }

    // Check for epoch coverage gaps (same as greedy algorithm)
    const epochGaps = verifyEpochCoverage(bestResult.allocations, request);

    if (epochGaps.length > 0) {
      // We have epoch gaps that need to be filled
      let additionalCost = 0n;

      for (const gap of epochGaps) {
        const gapEpochs = gap.end - gap.start;
        const gapCost = await this.storageCostFn(Number(request.size), gapEpochs);
        additionalCost += gapCost.storageCost;
      }

      const totalGapEpochs = epochGaps.reduce((sum, gap) => sum + (gap.end - gap.start), 0);

      // Update or create needsNewReservation
      if (bestResult.needsNewReservation) {
        // Combine remaining size reservation with epoch gap reservation
        bestResult.totalCost += additionalCost;
        // Note: This is a simplification - in reality we'd need multiple reservations
      } else {
        bestResult.needsNewReservation = {
          size: request.size,
          epochs: totalGapEpochs,
          cost: additionalCost
        };
        bestResult.totalCost += additionalCost;
      }
    }

    return bestResult;
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

    let totalCost = greedyAllocations.reduce((sum, a) => sum + a.cost, 0n);
    let needsNewReservation: { size: bigint; epochs: number; cost: bigint } | undefined = undefined;

    // Check if we need new reservation for remaining size
    if (remainingSize > 0n) {
      const epochs = request.endEpoch - request.startEpoch;
      const newReservationCost = await this.storageCostFn(Number(remainingSize), epochs);

      needsNewReservation = {
        size: remainingSize,
        epochs,
        cost: newReservationCost.storageCost
      };
      totalCost += newReservationCost.storageCost;
    }

    // Check for epoch coverage gaps (same as other algorithms)
    const epochGaps = verifyEpochCoverage(greedyAllocations, request);

    if (epochGaps.length > 0) {
      // We have epoch gaps that need to be filled
      let additionalCost = 0n;

      for (const gap of epochGaps) {
        const gapEpochs = gap.end - gap.start;
        const gapCost = await this.storageCostFn(Number(request.size), gapEpochs);
        additionalCost += gapCost.storageCost;
      }

      const totalGapEpochs = epochGaps.reduce((sum, gap) => sum + (gap.end - gap.start), 0);

      // Update or create needsNewReservation
      if (needsNewReservation) {
        // Combine remaining size reservation with epoch gap reservation
        totalCost += additionalCost;
      } else {
        needsNewReservation = {
          size: request.size,
          epochs: totalGapEpochs,
          cost: additionalCost
        };
        totalCost += additionalCost;
      }
    }

    return {
      allocations: greedyAllocations,
      totalCost,
      needsNewReservation
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
  type: 'buy_full_storage' | 'buy_partial_storage_size' | 'buy_partial_storage_epoch' |
        'split_by_epoch' | 'split_by_size' | 'fuse_period' | 'fuse_amount' | 'reserve_space';
  description: string;

  // For marketplace purchase operations (buy_*)
  storageObjectId?: string;

  // For buy_partial_storage_size
  splitSize?: bigint;

  // For buy_partial_storage_epoch
  splitStartEpoch?: number;
  splitEndEpoch?: number;

  // For split operations (when performed on already-owned storage)
  splitEpoch?: number; // for split_by_epoch

  // For reserve_space operations
  reserveSize?: bigint;
  startEpoch?: number;
  endEpoch?: number;
  cost?: bigint;
}

// Export function for generating the operations needed to create a single Storage object
export function generateStorageOperations(
  result: OptimizationResult,
  requestStartEpoch: number,
  requestEndEpoch: number,
  requestSize: bigint
): StorageOperation[] {
  const operations: StorageOperation[] = [];

  // Step 1: Process each allocation - determine buy operation type
  for (const allocation of result.allocations) {
    const storage = allocation.storageObject;

    // Check if we're buying the full storage object or partial
    const buyingFullSize = allocation.usedSize === storage.storageSize;
    const buyingFullEpochRange = allocation.usedStartEpoch === storage.startEpoch &&
                                  allocation.usedEndEpoch === storage.endEpoch;

    if (buyingFullSize && buyingFullEpochRange) {
      // Case 1: Buy the entire storage object as-is
      operations.push({
        type: 'buy_full_storage',
        storageObjectId: storage.id,
        description: `buy_full_storage(${storage.id}) → ${Number(allocation.usedSize) / (1024 * 1024)}MB for epochs ${allocation.usedStartEpoch}-${allocation.usedEndEpoch}`
      });
    } else if (!buyingFullSize && buyingFullEpochRange) {
      // Case 2: Buy partial size, full epoch range (atomic split by size)
      operations.push({
        type: 'buy_partial_storage_size',
        storageObjectId: storage.id,
        splitSize: allocation.usedSize,
        description: `buy_partial_storage_size(${storage.id}, ${allocation.usedSize} bytes) → ${Number(allocation.usedSize) / (1024 * 1024)}MB for epochs ${allocation.usedStartEpoch}-${allocation.usedEndEpoch}`
      });
    } else if (buyingFullSize && !buyingFullEpochRange) {
      // Case 3: Buy full size, partial epoch range (atomic split by epoch)
      operations.push({
        type: 'buy_partial_storage_epoch',
        storageObjectId: storage.id,
        splitStartEpoch: allocation.usedStartEpoch,
        splitEndEpoch: allocation.usedEndEpoch,
        description: `buy_partial_storage_epoch(${storage.id}, epochs ${allocation.usedStartEpoch}-${allocation.usedEndEpoch}) → ${Number(allocation.usedSize) / (1024 * 1024)}MB`
      });
    } else {
      // Case 4: Buy partial size AND partial epoch range
      // This requires buying full object first, then splitting
      operations.push({
        type: 'buy_full_storage',
        storageObjectId: storage.id,
        description: `buy_full_storage(${storage.id}) → to be split`
      });

      // Split by epoch first if needed
      if (allocation.usedStartEpoch > storage.startEpoch || allocation.usedEndEpoch < storage.endEpoch) {
        if (allocation.usedStartEpoch > storage.startEpoch) {
          operations.push({
            type: 'split_by_epoch',
            splitEpoch: allocation.usedStartEpoch,
            description: `split_by_epoch(${allocation.usedStartEpoch}) → keep portion from ${allocation.usedStartEpoch} onwards`
          });
        }
        if (allocation.usedEndEpoch < storage.endEpoch) {
          operations.push({
            type: 'split_by_epoch',
            splitEpoch: allocation.usedEndEpoch,
            description: `split_by_epoch(${allocation.usedEndEpoch}) → keep portion before ${allocation.usedEndEpoch}`
          });
        }
      }

      // Then split by size if needed
      if (allocation.usedSize < storage.storageSize) {
        operations.push({
          type: 'split_by_size',
          splitSize: allocation.usedSize,
          description: `split_by_size(${allocation.usedSize} bytes) → keep ${Number(allocation.usedSize) / (1024 * 1024)}MB`
        });
      }
    }
  }

  // Step 2: Reserve new storage if needed
  if (result.needsNewReservation) {
    operations.push({
      type: 'reserve_space',
      reserveSize: result.needsNewReservation.size,
      startEpoch: requestStartEpoch,
      endEpoch: requestEndEpoch,
      cost: result.needsNewReservation.cost,
      description: `reserve_space(${Number(result.needsNewReservation.size) / (1024 * 1024)}MB, epochs ${requestStartEpoch}-${requestEndEpoch}) → cost: ${result.needsNewReservation.cost} FROST`
    });
  }

  // Step 3: Fuse all storage objects into one if we have multiple pieces
  if (result.allocations.length > 1 || (result.allocations.length > 0 && result.needsNewReservation)) {
    // Determine fusion strategy based on allocation characteristics
    const allSameEpochRange = result.allocations.every(
      a => a.usedStartEpoch === requestStartEpoch && a.usedEndEpoch === requestEndEpoch
    );

    if (allSameEpochRange && (!result.needsNewReservation ||
        (requestStartEpoch === requestStartEpoch && requestEndEpoch === requestEndEpoch))) {
      // All objects cover the same period - fuse by amount (combining sizes)
      const fuseCount = result.allocations.length + (result.needsNewReservation ? 1 : 0) - 1;
      for (let i = 0; i < fuseCount; i++) {
        operations.push({
          type: 'fuse_amount',
          description: `fuse_amount() → combine storage amounts (same epoch range)`
        });
      }
    } else {
      // Objects cover different periods or mixed - use period fusion
      // Sort allocations by start epoch
      const sortedAllocations = [...result.allocations].sort((a, b) => a.usedStartEpoch - b.usedStartEpoch);

      // Check if we can use fuse_period (adjacent periods, same size)
      let canUseFusePeriod = true;
      for (let i = 0; i < sortedAllocations.length - 1; i++) {
        if (sortedAllocations[i].usedEndEpoch !== sortedAllocations[i + 1].usedStartEpoch ||
            sortedAllocations[i].usedSize !== sortedAllocations[i + 1].usedSize) {
          canUseFusePeriod = false;
          break;
        }
      }

      if (canUseFusePeriod) {
        const fuseCount = sortedAllocations.length - 1;
        for (let i = 0; i < fuseCount; i++) {
          operations.push({
            type: 'fuse_period',
            description: `fuse_period() → merge adjacent time periods (same size)`
          });
        }
      } else {
        // Complex case: need multiple fusion operations
        // This is a simplified approach - may need refinement based on actual requirements
        const totalFusions = result.allocations.length + (result.needsNewReservation ? 1 : 0) - 1;
        for (let i = 0; i < totalFusions; i++) {
          operations.push({
            type: 'fuse_amount',
            description: `fuse_amount() → combine storage objects`
          });
        }
      }
    }
  }

  return operations;
}
