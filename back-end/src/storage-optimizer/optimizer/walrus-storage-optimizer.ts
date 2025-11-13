// Types and Interfaces
export interface StorageObject {
  id: string;
  startEpoch: number;
  endEpoch: number;
  storageSize: bigint; // in bytes
  price: bigint; // total price for this storage object (kept for compatibility, not used in calculation)
  pricePerSizePerEpoch: bigint; // price per byte per epoch (scaled by 1e9 / PRECISION_SCALE)
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
    startEpoch: number;
    endEpoch: number;
    epochs: number;
    cost: bigint;
  };
}

// Helper functions
function calculateProRatedPrice(
  storage: StorageObject,
  usedSize: bigint,
  usedStartEpoch: number,
  usedEndEpoch: number,
): bigint {
  // CRITICAL: Must match contract's calculation exactly
  // Contract uses: (price_per_size_per_epoch * size * duration) / PRECISION_SCALE
  // where PRECISION_SCALE = 1_000_000_000 (1e9)
  const PRECISION_SCALE = 1_000_000_000n;
  const usedEpochs = BigInt(usedEndEpoch - usedStartEpoch);

  // Use pricePerSizePerEpoch directly from storage object (already scaled)
  // Formula: (pricePerSizePerEpoch * usedSize * usedEpochs) / PRECISION_SCALE
  const result =
    (storage.pricePerSizePerEpoch * usedSize * usedEpochs) / PRECISION_SCALE;

  return result;
}

function overlapsWithRequest(
  storage: StorageObject,
  request: StorageRequest,
): boolean {
  return (
    storage.startEpoch < request.endEpoch &&
    storage.endEpoch > request.startEpoch
  );
}

function getOverlapPeriod(
  storage: StorageObject,
  request: StorageRequest,
): { start: number; end: number } {
  return {
    start: Math.max(storage.startEpoch, request.startEpoch),
    end: Math.min(storage.endEpoch, request.endEpoch),
  };
}

/**
 * Verify if allocations cover the full requested epoch range
 * Returns any gaps in epoch coverage that need to be filled
 */
function verifyEpochCoverage(
  allocations: StorageAllocation[],
  request: StorageRequest,
): Array<{ start: number; end: number }> {
  if (allocations.length === 0) {
    // No allocations - entire range is a gap
    return [{ start: request.startEpoch, end: request.endEpoch }];
  }

  // Sort allocations by start epoch
  const sorted = [...allocations].sort(
    (a, b) => a.usedStartEpoch - b.usedStartEpoch,
  );

  const gaps: Array<{ start: number; end: number }> = [];

  // Check if there's a gap before the first allocation
  if (sorted[0].usedStartEpoch > request.startEpoch) {
    gaps.push({
      start: request.startEpoch,
      end: sorted[0].usedStartEpoch,
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
      end: request.endEpoch,
    });
  }

  return gaps;
}

// Main optimization algorithm
export class WalrusStorageOptimizer {
  private storageObjects: StorageObject[];
  private storageCostFn: (
    size: number,
    epochs: number,
  ) => Promise<{ storageCost: bigint }>;

  constructor(
    storageObjects: StorageObject[],
    storageCostFn: (
      size: number,
      epochs: number,
    ) => Promise<{ storageCost: bigint }>,
  ) {
    this.storageObjects = storageObjects;
    this.storageCostFn = storageCostFn;
  }

  /**
   * Find the optimal combination of storage objects to fulfill a storage request
   * Compares 4 strategies: greedy, DP, hybrid, and reserve-only
   */
  async findOptimalAllocation(
    request: StorageRequest,
  ): Promise<OptimizationResult> {
    console.log(`\n[OPTIMIZER] findOptimalAllocation called`);
    console.log(
      `  Request: size=${request.size} epochs=${request.startEpoch}-${request.endEpoch}`,
    );
    console.log(`  Available storage objects: ${this.storageObjects.length}`);

    // Filter storage objects that overlap with the requested period
    const availableStorage = this.storageObjects.filter((s) =>
      overlapsWithRequest(s, request),
    );
    console.log(`  After overlap filter: ${availableStorage.length} objects`);
    availableStorage.forEach((s, i) => {
      console.log(
        `    [${i}] size=${s.storageSize} epochs=${s.startEpoch}-${s.endEpoch} price=${s.price}`,
      );
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
      reserveOnlyStrategy, // Always compare with buying fresh from system
    ]);

    console.log(`  Strategy costs:`);
    console.log(
      `    Greedy: ${strategies[0].totalCost} (${strategies[0].allocations.length} allocations)`,
    );
    console.log(
      `    DP: ${strategies[1].totalCost} (${strategies[1].allocations.length} allocations)`,
    );
    console.log(
      `    Hybrid: ${strategies[2].totalCost} (${strategies[2].allocations.length} allocations)`,
    );
    console.log(`    Reserve-only: ${strategies[3].totalCost}`);

    // Return the strategy with the lowest cost
    const best = strategies.reduce((best, current) =>
      current.totalCost < best.totalCost ? current : best,
    );
    console.log(
      `  Best strategy: cost=${best.totalCost}, allocations=${best.allocations.length}\n`,
    );
    return best;
  }

  /**
   * Greedy algorithm: Select storage objects with the best price per unit
   */
  private async greedyAllocation(
    request: StorageRequest,
    availableStorage: StorageObject[],
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
      const usedSize =
        storage.storageSize < remainingSize
          ? storage.storageSize
          : remainingSize;
      // CRITICAL: buy_partial_storage_size charges for the listing's FULL epoch range
      // The contract has no epoch selection - you get the entire listing's epoch range
      const cost = calculateProRatedPrice(
        storage,
        usedSize,
        storage.startEpoch,
        storage.endEpoch,
      );

      // Compare cost of using this object vs reserving the SAME SIZE from system
      const epochs = request.endEpoch - request.startEpoch;
      const reserveCostForThisSize = await this.storageCostFn(
        Number(usedSize),
        epochs,
      );

      console.log(
        `    Considering: size=${storage.storageSize}, usedSize=${usedSize}`,
      );
      console.log(`      Marketplace cost: ${cost}`);
      console.log(
        `      System cost (same size): ${reserveCostForThisSize.storageCost}`,
      );

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
        seller: storage.owner,
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
    let needsNewReservation:
      | {
          size: bigint;
          startEpoch: number;
          endEpoch: number;
          epochs: number;
          cost: bigint;
        }
      | undefined = undefined;
    let additionalCost = 0n;

    // Case 1: We have remaining size that needs to be allocated
    if (remainingSize > 0n) {
      const epochs = request.endEpoch - request.startEpoch;
      const cost = await this.storageCostFn(Number(remainingSize), epochs);
      needsNewReservation = {
        size: remainingSize,
        startEpoch: request.startEpoch,
        endEpoch: request.endEpoch,
        epochs,
        cost: cost.storageCost,
      };
      console.log(
        `    Need new reservation for remaining size: ${remainingSize} bytes, cost: ${cost.storageCost}`,
      );
    }
    // Case 2: Size is covered, but epoch range has gaps
    else if (epochGaps.length > 0) {
      // We need to reserve the full request size for the uncovered epoch periods
      // Calculate total cost for all gaps
      for (const gap of epochGaps) {
        const gapEpochs = gap.end - gap.start;
        const gapCost = await this.storageCostFn(
          Number(request.size),
          gapEpochs,
        );
        additionalCost += gapCost.storageCost;
        console.log(
          `      Gap ${gap.start}-${gap.end}: ${gapEpochs} epochs, cost: ${gapCost.storageCost}`,
        );
      }

      // For single gap (most common case), use the gap's exact epoch range
      // For multiple gaps, we'll use the first gap for now (this may need refinement)
      const totalGapEpochs = epochGaps.reduce(
        (sum, gap) => sum + (gap.end - gap.start),
        0,
      );
      const primaryGap = epochGaps[0]; // Use first gap for epoch range

      needsNewReservation = {
        size: request.size,
        startEpoch: primaryGap.start,
        endEpoch: primaryGap.end,
        epochs: totalGapEpochs,
        cost: additionalCost,
      };
      console.log(
        `    Need new reservation for epoch gaps: ${request.size} bytes for epochs ${primaryGap.start}-${primaryGap.end} (${totalGapEpochs} total epochs), cost: ${additionalCost}`,
      );
    }

    const totalCost =
      allocations.reduce((sum, a) => sum + a.cost, 0n) +
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
    availableStorage: StorageObject[],
  ): Promise<OptimizationResult> {
    const ONE_GIB = 1024 * 1024 * 1024;
    const TEN_GIB = 10 * ONE_GIB;

    // OPTIMIZATION 1: For very large requests (>=10 GiB), skip DP entirely
    // DP becomes too slow, use greedy algorithm instead
    if (Number(request.size) >= TEN_GIB) {
      console.log(
        `[DP] Request too large (${Number(request.size)} bytes), using greedy instead`,
      );
      return this.greedyAllocation(request, availableStorage);
    }

    // OPTIMIZATION 2: Use adaptive granularity
    // Small requests: KB units, Large requests: MiB units
    const UNIT_SIZE =
      Number(request.size) >= ONE_GIB
        ? 1024 * 1024 // MiB for large requests
        : 1024; // KB for small requests

    const targetSizeUnits = Math.ceil(Number(request.size) / UNIT_SIZE);
    const n = availableStorage.length;

    // OPTIMIZATION 3: Add complexity limit
    // If DP table would be too large, fall back to greedy
    const MAX_DP_ITERATIONS = 100_000_000; // 100M iterations max
    const estimatedIterations = n * targetSizeUnits * (targetSizeUnits / 2);

    if (estimatedIterations > MAX_DP_ITERATIONS) {
      console.log(
        `[DP] Estimated iterations (${estimatedIterations}) exceeds limit, using greedy instead`,
      );
      return this.greedyAllocation(request, availableStorage);
    }

    console.log(
      `[DP] Using ${UNIT_SIZE === 1024 ? 'KB' : 'MiB'} units, target=${targetSizeUnits}, iterations≈${estimatedIterations.toLocaleString()}`,
    );

    // Create DP table: dp[i][size] = minimum cost to achieve 'size' using first i objects
    const dp: Map<string, { cost: bigint; allocations: StorageAllocation[] }> =
      new Map();

    // Initialize base case
    dp.set('0,0', { cost: 0n, allocations: [] });

    // Fill DP table
    for (let i = 1; i <= n; i++) {
      const storage = availableStorage[i - 1];
      const overlap = getOverlapPeriod(storage, request);
      const maxUsableSizeUnits = Math.floor(
        Number(storage.storageSize) / UNIT_SIZE,
      );

      for (let sizeUnits = 0; sizeUnits <= targetSizeUnits; sizeUnits++) {
        // Option 1: Don't use this storage object
        const prevKey = `${i - 1},${sizeUnits}`;
        if (dp.has(prevKey)) {
          const prev = dp.get(prevKey)!;
          dp.set(`${i},${sizeUnits}`, prev);
        }

        // Option 2: Use part or all of this storage object
        for (
          let useSizeUnits = 1;
          useSizeUnits <= Math.min(maxUsableSizeUnits, sizeUnits);
          useSizeUnits++
        ) {
          const remainingSizeUnits = sizeUnits - useSizeUnits;
          const prevKey = `${i - 1},${remainingSizeUnits}`;

          if (dp.has(prevKey)) {
            const prev = dp.get(prevKey)!;
            // Convert units back to bytes for cost calculation
            const usedSizeBytes = BigInt(useSizeUnits * UNIT_SIZE);
            // CRITICAL: buy_partial_storage_size charges for the listing's FULL epoch range
            const cost = calculateProRatedPrice(
              storage,
              usedSizeBytes,
              storage.startEpoch,
              storage.endEpoch,
            );
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
                    seller: storage.owner,
                  },
                ],
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
        totalCost: result.cost,
      };
    } else {
      // Find the best partial solution and add new reservation for the rest
      let bestPartial: {
        cost: bigint;
        allocations: StorageAllocation[];
        size: number;
      } = {
        cost: BigInt(Number.MAX_SAFE_INTEGER),
        allocations: [],
        size: 0,
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
      const allocatedBytes = bestPartial.allocations.reduce(
        (sum, a) => sum + a.usedSize,
        0n,
      );
      const remainingSize = request.size - allocatedBytes;
      const epochs = request.endEpoch - request.startEpoch;
      const newReservationCost = await this.storageCostFn(
        Number(remainingSize),
        epochs,
      );

      bestResult = {
        allocations: bestPartial.allocations,
        totalCost: bestPartial.cost + newReservationCost.storageCost,
        needsNewReservation: {
          size: remainingSize,
          startEpoch: request.startEpoch,
          endEpoch: request.endEpoch,
          epochs,
          cost: newReservationCost.storageCost,
        },
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
        const gapCost = await this.storageCostFn(
          Number(request.size),
          gapEpochs,
        );
        additionalCost += gapCost.storageCost;
      }

      const totalGapEpochs = epochGaps.reduce(
        (sum, gap) => sum + (gap.end - gap.start),
        0,
      );
      const primaryGap = epochGaps[0]; // Use first gap for epoch range

      // Update or create needsNewReservation
      if (bestResult.needsNewReservation) {
        // Combine remaining size reservation with epoch gap reservation
        bestResult.totalCost += additionalCost;
        // Note: This is a simplification - in reality we'd need multiple reservations
      } else {
        bestResult.needsNewReservation = {
          size: request.size,
          startEpoch: primaryGap.start,
          endEpoch: primaryGap.end,
          epochs: totalGapEpochs,
          cost: additionalCost,
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
    availableStorage: StorageObject[],
  ): Promise<OptimizationResult> {
    // First, identify storage objects that cover the entire period
    const fullPeriodStorage = availableStorage.filter(
      (s) =>
        s.startEpoch <= request.startEpoch && s.endEpoch >= request.endEpoch,
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

        const usedSize =
          storage.storageSize < remainingSize
            ? storage.storageSize
            : remainingSize;
        // CRITICAL: buy_partial_storage_size charges for the listing's FULL epoch range
        const cost = calculateProRatedPrice(
          storage,
          usedSize,
          storage.startEpoch,
          storage.endEpoch,
        );
        greedyAllocations.push({
          storageObject: storage,
          usedSize,
          usedStartEpoch: request.startEpoch,
          usedEndEpoch: request.endEpoch,
          cost,
          sellerPayment: cost, // The calculated cost IS the seller's payment
          seller: storage.owner,
        });

        remainingSize -= usedSize;
      }
    }

    // If we still need storage, use DP for the remaining partial period storage
    if (remainingSize > 0n) {
      const partialStorage = availableStorage.filter(
        (s) =>
          !fullPeriodStorage.includes(s) && overlapsWithRequest(s, request),
      );

      if (partialStorage.length > 0) {
        const partialRequest: StorageRequest = {
          ...request,
          size: remainingSize,
        };

        const dpResult = await this.dynamicProgrammingAllocation(
          partialRequest,
          partialStorage,
        );
        greedyAllocations.push(...dpResult.allocations);

        const totalCost = greedyAllocations.reduce(
          (sum, a) => sum + a.cost,
          0n,
        );

        return {
          allocations: greedyAllocations,
          totalCost: totalCost + (dpResult.needsNewReservation?.cost || 0n),
          needsNewReservation: dpResult.needsNewReservation,
        };
      }
    }

    let totalCost = greedyAllocations.reduce((sum, a) => sum + a.cost, 0n);
    let needsNewReservation:
      | {
          size: bigint;
          startEpoch: number;
          endEpoch: number;
          epochs: number;
          cost: bigint;
        }
      | undefined = undefined;

    // Check if we need new reservation for remaining size
    if (remainingSize > 0n) {
      const epochs = request.endEpoch - request.startEpoch;
      const newReservationCost = await this.storageCostFn(
        Number(remainingSize),
        epochs,
      );

      needsNewReservation = {
        size: remainingSize,
        startEpoch: request.startEpoch,
        endEpoch: request.endEpoch,
        epochs,
        cost: newReservationCost.storageCost,
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
        const gapCost = await this.storageCostFn(
          Number(request.size),
          gapEpochs,
        );
        additionalCost += gapCost.storageCost;
      }

      const totalGapEpochs = epochGaps.reduce(
        (sum, gap) => sum + (gap.end - gap.start),
        0,
      );
      const primaryGap = epochGaps[0]; // Use first gap for epoch range

      // Update or create needsNewReservation
      if (needsNewReservation) {
        // Combine remaining size reservation with epoch gap reservation
        totalCost += additionalCost;
      } else {
        needsNewReservation = {
          size: request.size,
          startEpoch: primaryGap.start,
          endEpoch: primaryGap.end,
          epochs: totalGapEpochs,
          cost: additionalCost,
        };
        totalCost += additionalCost;
      }
    }

    return {
      allocations: greedyAllocations,
      totalCost,
      needsNewReservation,
    };
  }

  /**
   * Create a new reservation when no existing storage is available
   */
  private async createNewReservation(
    request: StorageRequest,
  ): Promise<OptimizationResult> {
    const epochs = request.endEpoch - request.startEpoch;
    const cost = await this.storageCostFn(Number(request.size), epochs);

    return {
      allocations: [],
      totalCost: cost.storageCost,
      needsNewReservation: {
        size: request.size,
        startEpoch: request.startEpoch,
        endEpoch: request.endEpoch,
        epochs,
        cost: cost.storageCost,
      },
    };
  }
}

export interface StorageOperation {
  type:
    | 'buy_full_storage'
    | 'buy_partial_storage_size'
    | 'buy_partial_storage_epoch'
    | 'split_by_epoch'
    | 'split_by_size'
    | 'fuse_period'
    | 'fuse_amount'
    | 'reserve_space';
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
  splitTargetOperation?: number; // Which operation's result to split (operation index)

  // For fuse operations - explicit targets
  fuseFirst?: number; // First operation index to fuse (modified in place)
  fuseSecond?: number; // Second operation index to fuse (consumed)

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
  requestSize: bigint,
): StorageOperation[] {
  const operations: StorageOperation[] = [];

  // Step 1: Process each allocation - determine buy operation type
  for (const allocation of result.allocations) {
    const storage = allocation.storageObject;

    // Check if we're buying the full storage object or partial
    const buyingFullSize = allocation.usedSize === storage.storageSize;
    const buyingFullEpochRange =
      allocation.usedStartEpoch === storage.startEpoch &&
      allocation.usedEndEpoch === storage.endEpoch;

    if (buyingFullSize && buyingFullEpochRange) {
      // Case 1: Buy the entire storage object as-is
      operations.push({
        type: 'buy_full_storage',
        storageObjectId: storage.id,
        description: `buy_full_storage(${storage.id}) → ${Number(allocation.usedSize) / (1024 * 1024)}MB for epochs ${allocation.usedStartEpoch}-${allocation.usedEndEpoch}`,
      });
    } else if (!buyingFullSize && buyingFullEpochRange) {
      // Case 2: Buy partial size, full epoch range (atomic split by size)
      operations.push({
        type: 'buy_partial_storage_size',
        storageObjectId: storage.id,
        splitSize: allocation.usedSize,
        description: `buy_partial_storage_size(${storage.id}, ${allocation.usedSize} bytes) → ${Number(allocation.usedSize) / (1024 * 1024)}MB for epochs ${allocation.usedStartEpoch}-${allocation.usedEndEpoch}`,
      });
    } else if (buyingFullSize && !buyingFullEpochRange) {
      // Case 3: Buy full size, partial epoch range (atomic split by epoch)
      operations.push({
        type: 'buy_partial_storage_epoch',
        storageObjectId: storage.id,
        splitStartEpoch: allocation.usedStartEpoch,
        splitEndEpoch: allocation.usedEndEpoch,
        description: `buy_partial_storage_epoch(${storage.id}, epochs ${allocation.usedStartEpoch}-${allocation.usedEndEpoch}) → ${Number(allocation.usedSize) / (1024 * 1024)}MB`,
      });
    } else {
      // Case 4: Buy partial size AND partial epochs
      // Must use size-first strategy because buy_partial_storage_epoch charges for FULL storage size
      // Only buy_partial_storage_size properly pro-rates the payment

      const needsEpochSplit =
        allocation.usedStartEpoch > storage.startEpoch ||
        allocation.usedEndEpoch < storage.endEpoch;

      // Always split by size first via marketplace (properly pro-rated payment)
      operations.push({
        type: 'buy_partial_storage_size',
        storageObjectId: storage.id,
        splitSize: allocation.usedSize,
        description: `buy_partial_storage_size(${allocation.usedSize} bytes) → marketplace keeps size remainder`,
      });

      if (needsEpochSplit) {
        // Then manually split epochs on the owned storage (unavoidable remainders)
        if (allocation.usedStartEpoch > storage.startEpoch) {
          operations.push({
            type: 'split_by_epoch',
            splitEpoch: allocation.usedStartEpoch,
            description: `split_by_epoch(${allocation.usedStartEpoch}) → remainder transferred to user`,
          });
        }
        if (allocation.usedEndEpoch < storage.endEpoch) {
          operations.push({
            type: 'split_by_epoch',
            splitEpoch: allocation.usedEndEpoch,
            description: `split_by_epoch(${allocation.usedEndEpoch}) → remainder transferred to user`,
          });
        }
      }
    }
  }

  // Step 2: Reserve new storage if needed
  if (result.needsNewReservation) {
    operations.push({
      type: 'reserve_space',
      reserveSize: result.needsNewReservation.size,
      startEpoch: result.needsNewReservation.startEpoch,
      endEpoch: result.needsNewReservation.endEpoch,
      cost: result.needsNewReservation.cost,
      description: `reserve_space(${Number(result.needsNewReservation.size) / (1024 * 1024)}MB, epochs ${result.needsNewReservation.startEpoch}-${result.needsNewReservation.endEpoch}) → cost: ${result.needsNewReservation.cost} FROST`,
    });
  }

  // Step 3: Fuse all storage objects into one if we have multiple pieces
  if (
    result.allocations.length > 1 ||
    (result.allocations.length > 0 && result.needsNewReservation)
  ) {
    // Create a list of all storage pieces (allocations + new reservation)
    const allPieces: Array<{
      startEpoch: number;
      endEpoch: number;
      size: bigint;
    }> = [
      ...result.allocations.map((a) => ({
        startEpoch: a.usedStartEpoch,
        endEpoch: a.usedEndEpoch,
        size: a.usedSize,
      })),
    ];

    if (result.needsNewReservation) {
      allPieces.push({
        startEpoch: result.needsNewReservation.startEpoch,
        endEpoch: result.needsNewReservation.endEpoch,
        size: result.needsNewReservation.size,
      });
    }

    // Sort by start epoch
    const sortedPieces = allPieces.sort((a, b) => a.startEpoch - b.startEpoch);

    // Check if all pieces have the same epoch range (use fuse_amount)
    const allSameEpochRange = sortedPieces.every(
      (p) =>
        p.startEpoch === sortedPieces[0].startEpoch &&
        p.endEpoch === sortedPieces[0].endEpoch,
    );

    if (allSameEpochRange) {
      // All objects cover the same period - fuse by amount (combining sizes)
      const fuseCount = sortedPieces.length - 1;
      for (let i = 0; i < fuseCount; i++) {
        operations.push({
          type: 'fuse_amount',
          description: `fuse_amount() → combine storage amounts (same epoch range ${sortedPieces[0].startEpoch}-${sortedPieces[0].endEpoch})`,
        });
      }
    } else {
      // Check if pieces are adjacent and same size (use fuse_period)
      let allAdjacent = true;
      let allSameSize = true;
      const referenceSize = sortedPieces[0].size;

      for (let i = 0; i < sortedPieces.length - 1; i++) {
        if (sortedPieces[i].endEpoch !== sortedPieces[i + 1].startEpoch) {
          allAdjacent = false;
        }
        if (sortedPieces[i].size !== referenceSize) {
          allSameSize = false;
        }
      }
      if (sortedPieces[sortedPieces.length - 1].size !== referenceSize) {
        allSameSize = false;
      }

      if (allAdjacent && allSameSize) {
        // Perfect case: adjacent periods with same size - use fuse_period
        const fuseCount = sortedPieces.length - 1;
        for (let i = 0; i < fuseCount; i++) {
          operations.push({
            type: 'fuse_period',
            description: `fuse_period() → merge epochs ${sortedPieces[i].startEpoch}-${sortedPieces[i].endEpoch} with ${sortedPieces[i + 1].startEpoch}-${sortedPieces[i + 1].endEpoch}`,
          });
        }
      } else {
        // Complex case: pieces have different epoch ranges and/or different sizes
        // Strategy: Group by epoch range, fuse within groups, then try to fuse groups

        // Group pieces by epoch range
        const epochGroups = new Map<string, typeof sortedPieces>();
        for (const piece of sortedPieces) {
          const key = `${piece.startEpoch}-${piece.endEpoch}`;
          if (!epochGroups.has(key)) {
            epochGroups.set(key, []);
          }
          epochGroups.get(key)!.push(piece);
        }

        // Sort groups by start epoch
        const sortedGroups = Array.from(epochGroups.entries())
          .map(([key, pieces]) => ({
            key,
            startEpoch: pieces[0].startEpoch,
            endEpoch: pieces[0].endEpoch,
            pieces,
          }))
          .sort((a, b) => a.startEpoch - b.startEpoch);

        // Step 3a: Fuse within each epoch group using fuse_amount
        // Track which operation index holds each group's fused result
        let currentOperationIndex =
          result.allocations.length + (result.needsNewReservation ? 1 : 0);
        const groupToOperationIndex = new Map<
          (typeof sortedGroups)[0],
          number
        >();

        for (const group of sortedGroups) {
          if (group.pieces.length > 1) {
            const fuseCount = group.pieces.length - 1;
            for (let i = 0; i < fuseCount; i++) {
              operations.push({
                type: 'fuse_amount',
                description: `fuse_amount() → combine ${group.pieces.length} pieces within epoch range ${group.startEpoch}-${group.endEpoch}`,
              });
              currentOperationIndex++;
            }
            // After fusing, the result is in the first piece's operation index
            // But we need to find which allocation index that is
            const firstPieceIndex = result.allocations.findIndex(
              (a) =>
                a.usedStartEpoch === group.pieces[0].startEpoch &&
                a.usedEndEpoch === group.pieces[0].endEpoch,
            );
            if (firstPieceIndex !== -1) {
              groupToOperationIndex.set(group, firstPieceIndex);
            }
          } else {
            // Single piece group - find its operation index
            const pieceIndex = result.allocations.findIndex(
              (a) =>
                a.usedStartEpoch === group.pieces[0].startEpoch &&
                a.usedEndEpoch === group.pieces[0].endEpoch,
            );
            if (pieceIndex !== -1) {
              groupToOperationIndex.set(group, pieceIndex);
            } else if (
              result.needsNewReservation &&
              group.pieces[0].startEpoch ===
                result.needsNewReservation.startEpoch &&
              group.pieces[0].endEpoch === result.needsNewReservation.endEpoch
            ) {
              // This is the reserve_space operation
              groupToOperationIndex.set(group, result.allocations.length);
            }
          }
        }

        // Step 3b: Fuse remaining groups
        // After fusing within groups, we have N groups that need to be combined into one final piece
        // Strategy: Iteratively fuse groups until only one remains
        if (sortedGroups.length > 1) {
          // Calculate total size for each group after fusing within group
          const groupSizes = sortedGroups.map((group) =>
            group.pieces.reduce((sum, p) => sum + p.size, 0n),
          );

          // Check if all groups have same total size
          const allGroupsSameSize = groupSizes.every(
            (size) => size === groupSizes[0],
          );

          // Detect overlap, adjacency, or gaps between groups
          let groupsOverlap = false;
          let groupsHaveGaps = false;
          let allGroupsAdjacent = true;

          for (let i = 0; i < sortedGroups.length - 1; i++) {
            const currentEnd = sortedGroups[i].endEpoch;
            const nextStart = sortedGroups[i + 1].startEpoch;

            if (currentEnd > nextStart) {
              // Current group extends past the start of next group - overlap
              groupsOverlap = true;
              allGroupsAdjacent = false;
            } else if (currentEnd < nextStart) {
              // There's a gap between groups
              groupsHaveGaps = true;
              allGroupsAdjacent = false;
            }
            // If currentEnd === nextStart, groups are perfectly adjacent (no change needed)
          }

          if (allGroupsAdjacent && allGroupsSameSize) {
            // Perfect case: Groups are adjacent and have same size - fuse them with fuse_period
            const fuseCount = sortedGroups.length - 1;
            for (let i = 0; i < fuseCount; i++) {
              operations.push({
                type: 'fuse_period',
                description: `fuse_period() → merge group ${sortedGroups[i].startEpoch}-${sortedGroups[i].endEpoch} with ${sortedGroups[i + 1].startEpoch}-${sortedGroups[i + 1].endEpoch}`,
              });
            }
          } else if (
            (allGroupsAdjacent || groupsOverlap) &&
            !allGroupsSameSize
          ) {
            // Groups are adjacent or overlapping with different sizes
            // Strategy: Split overlapping groups at boundaries, then fuse segments

            // Step 1: Find all unique epoch boundaries
            const epochBoundaries = new Set<number>();
            for (const group of sortedGroups) {
              epochBoundaries.add(group.startEpoch);
              epochBoundaries.add(group.endEpoch);
            }
            const sortedBoundaries = Array.from(epochBoundaries).sort(
              (a, b) => a - b,
            );

            // Step 2: Track which operation holds which segment after splits
            // Key: "startEpoch-endEpoch", Value: array of operation indices
            const segmentToOperation = new Map<string, number[]>();

            // Initialize with the original groups
            for (const group of sortedGroups) {
              const opIndex = groupToOperationIndex.get(group);
              if (opIndex !== undefined) {
                const key = `${group.startEpoch}-${group.endEpoch}`;
                if (!segmentToOperation.has(key)) {
                  segmentToOperation.set(key, []);
                }
                segmentToOperation.get(key)!.push(opIndex);
              }
            }

            // Step 3: For each boundary, split groups that span across it
            for (let i = 1; i < sortedBoundaries.length - 1; i++) {
              const splitEpoch = sortedBoundaries[i];

              // Find groups that need to be split at this boundary
              for (const group of sortedGroups) {
                if (
                  group.startEpoch < splitEpoch &&
                  group.endEpoch > splitEpoch
                ) {
                  // This group spans the boundary, split it
                  const splitTargetOp = groupToOperationIndex.get(group);
                  const originalKey = `${group.startEpoch}-${group.endEpoch}`;
                  const splitSourceOps = segmentToOperation.get(originalKey);

                  // We need to split the FIRST operation in this segment
                  const splitSourceOp = splitSourceOps?.[0] ?? splitTargetOp;

                  operations.push({
                    type: 'split_by_epoch',
                    splitEpoch: splitEpoch,
                    splitTargetOperation: splitSourceOp,
                    description: `split_by_epoch(${splitEpoch}) → split ${group.startEpoch}-${group.endEpoch} at ${splitEpoch} (from operation ${splitSourceOp})`,
                  });

                  // After split:
                  // - First piece (startEpoch-splitEpoch) stays at splitSourceOp
                  // - Second piece (splitEpoch-endEpoch) is at currentOperationIndex
                  // Remove the original segment from the map
                  segmentToOperation.delete(originalKey);

                  // Add the split results to their respective segments
                  const firstSegmentKey = `${group.startEpoch}-${splitEpoch}`;
                  const secondSegmentKey = `${splitEpoch}-${group.endEpoch}`;

                  if (!segmentToOperation.has(firstSegmentKey)) {
                    segmentToOperation.set(firstSegmentKey, []);
                  }
                  segmentToOperation.get(firstSegmentKey)!.push(splitSourceOp!);

                  if (!segmentToOperation.has(secondSegmentKey)) {
                    segmentToOperation.set(secondSegmentKey, []);
                  }
                  segmentToOperation
                    .get(secondSegmentKey)!
                    .push(currentOperationIndex);

                  currentOperationIndex++;

                  // Mark that we've split this group (prevent re-splitting)
                  group.endEpoch = splitEpoch;
                }
              }
            }

            // Step 4: For each segment between boundaries, fuse all pieces covering that segment
            // Track the resulting operation index for each segment after fusing
            const segmentResults = new Map<string, number>();

            for (let i = 0; i < sortedBoundaries.length - 1; i++) {
              const segmentStart = sortedBoundaries[i];
              const segmentEnd = sortedBoundaries[i + 1];
              const segmentKey = `${segmentStart}-${segmentEnd}`;

              // Find all pieces that cover this exact segment
              const piecesInSegment: number[] =
                segmentToOperation.get(segmentKey) || [];

              // Fuse all pieces in this segment
              if (piecesInSegment.length > 1) {
                // Fuse iteratively: 0+1, then result+2, then result+3, etc.
                const currentResult = piecesInSegment[0];
                for (let j = 1; j < piecesInSegment.length; j++) {
                  operations.push({
                    type: 'fuse_amount',
                    fuseFirst: currentResult,
                    fuseSecond: piecesInSegment[j],
                    description: `fuse_amount(op${currentResult}, op${piecesInSegment[j]}) → combine pieces for segment ${segmentStart}-${segmentEnd}`,
                  });
                  // After fusing, result stays at currentResult (first is modified in place)
                }
                segmentResults.set(segmentKey, currentResult);
              } else if (piecesInSegment.length === 1) {
                // Only one piece for this segment
                segmentResults.set(segmentKey, piecesInSegment[0]);
              }
            }

            // Step 5: Fuse adjacent segments together
            if (sortedBoundaries.length > 2) {
              const currentSegmentResult = segmentResults.get(
                `${sortedBoundaries[0]}-${sortedBoundaries[1]}`,
              );
              for (let i = 0; i < sortedBoundaries.length - 2; i++) {
                const nextSegmentKey = `${sortedBoundaries[i + 1]}-${sortedBoundaries[i + 2]}`;
                const nextSegmentResult = segmentResults.get(nextSegmentKey);

                if (
                  currentSegmentResult !== undefined &&
                  nextSegmentResult !== undefined
                ) {
                  operations.push({
                    type: 'fuse_period',
                    fuseFirst: currentSegmentResult,
                    fuseSecond: nextSegmentResult,
                    description: `fuse_period(op${currentSegmentResult}, op${nextSegmentResult}) → merge segments ${sortedBoundaries[i]}-${sortedBoundaries[i + 1]} with ${sortedBoundaries[i + 1]}-${sortedBoundaries[i + 2]}`,
                  });
                  // Result stays at currentSegmentResult
                }
              }
            }
          } else if (groupsHaveGaps) {
            // Groups have gaps between them - this means we have non-contiguous storage
            // This should not happen if the optimizer is working correctly, as we should
            // reserve space for gaps. Log detailed error information.
            const gapInfo: string[] = [];
            for (let i = 0; i < sortedGroups.length - 1; i++) {
              const gap =
                sortedGroups[i + 1].startEpoch - sortedGroups[i].endEpoch;
              if (gap > 0) {
                gapInfo.push(
                  `gap of ${gap} epochs between ${sortedGroups[i].endEpoch} and ${sortedGroups[i + 1].startEpoch}`,
                );
              }
            }
            throw new Error(
              `Cannot fuse storage groups with gaps: ${gapInfo.join(', ')}. ` +
                `This indicates a bug in the optimization algorithm.`,
            );
          } else {
            // All groups have the same size but overlap - just fuse them
            // This is an edge case but we can handle it with fuse_amount
            const totalPieces = sortedGroups.reduce(
              (sum, g) => sum + g.pieces.length,
              0,
            );
            if (totalPieces > 1) {
              for (let i = 0; i < totalPieces - 1; i++) {
                operations.push({
                  type: 'fuse_amount',
                  description: `fuse_amount() → combine overlapping groups with same size`,
                });
              }
            }
          }
        }
      }
    }
  }

  return operations;
}
