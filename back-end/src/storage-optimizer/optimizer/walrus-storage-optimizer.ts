// Types and Interfaces
export interface StorageObject {
  id: string;
  startEpoch: number;
  endEpoch: number;
  storageSize: bigint; // in bytes
  price: bigint; // total price for this storage object
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
   * SIMPLIFIED OPTIMIZER
   *
   * Strategy: Only use storage that FULLY covers the request period
   * - No cross-epoch optimization (no splits needed)
   * - Simple greedy selection by price per byte
   * - Fall back to system storage if no full coverage available
   *
   * This guarantees:
   * - All pieces have same epoch range → fuse_amount works perfectly
   * - No split operations needed → No remainder tracking
   * - Simple, linear flow → Easy to verify
   */
  async findOptimalAllocation(
    request: StorageRequest,
  ): Promise<OptimizationResult> {
    console.log(`\n[OPTIMIZER] Simplified optimizer starting`);
    console.log(
      `  Request: ${request.size} bytes, epochs ${request.startEpoch}-${request.endEpoch}`,
    );

    // 1. Filter to ONLY storage that FULLY COVERS the request period
    const fullCoverageStorage = this.storageObjects.filter(
      (s) =>
        s.startEpoch <= request.startEpoch && s.endEpoch >= request.endEpoch,
    );

    console.log(
      `  Found ${fullCoverageStorage.length} storage objects with full epoch coverage`,
    );

    // 2. If no full coverage available, just reserve from system
    if (fullCoverageStorage.length === 0) {
      console.log(`  No full-coverage storage available, using system storage`);
      return this.createNewReservation(request);
    }

    // 3. Sort by price per byte (cheapest first)
    const sorted = fullCoverageStorage.sort((a, b) => {
      const pricePerByteA = Number(a.price / a.storageSize);
      const pricePerByteB = Number(b.price / b.storageSize);
      return pricePerByteA - pricePerByteB;
    });

    // 4. Greedy selection: take cheapest pieces until request is filled
    const allocations: StorageAllocation[] = [];
    let remainingSize = request.size;
    let totalCost = 0n;

    for (const storage of sorted) {
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

      console.log(
        `  Selecting storage ${storage.id}: ${usedSize} bytes for ${cost} FROST`,
      );

      allocations.push({
        storageObject: storage,
        usedSize,
        usedStartEpoch: request.startEpoch, // What user needs (for later splits if needed)
        usedEndEpoch: request.endEpoch, // What user needs (for later splits if needed)
        cost,
        sellerPayment: cost,
        seller: storage.owner,
      });

      remainingSize -= usedSize;
      totalCost += cost;
    }

    // 5. Reserve any remaining size from system
    let needsNewReservation:
      | {
          size: bigint;
          startEpoch: number;
          endEpoch: number;
          epochs: number;
          cost: bigint;
        }
      | undefined = undefined;
    if (remainingSize > 0n) {
      const epochs = request.endEpoch - request.startEpoch;
      const reserveCost = await this.storageCostFn(
        Number(remainingSize),
        epochs,
      );

      console.log(
        `  Need to reserve ${remainingSize} bytes from system for ${reserveCost.storageCost} FROST`,
      );

      needsNewReservation = {
        size: remainingSize,
        startEpoch: request.startEpoch,
        endEpoch: request.endEpoch,
        epochs,
        cost: reserveCost.storageCost,
      };
      totalCost += reserveCost.storageCost;
    }

    // 6. Compare with system-only cost
    const systemOnlyCost = await this.storageCostFn(
      Number(request.size),
      request.endEpoch - request.startEpoch,
    );

    console.log(`  Marketplace total cost: ${totalCost} FROST`);
    console.log(`  System-only cost: ${systemOnlyCost.storageCost} FROST`);

    // If system is cheaper or similar, just use system
    if (systemOnlyCost.storageCost <= totalCost) {
      console.log(`  System storage is cheaper, using system-only`);
      return this.createNewReservation(request);
    }

    console.log(
      `  Using marketplace strategy (saves ${systemOnlyCost.storageCost - totalCost} FROST)`,
    );

    return {
      allocations,
      totalCost,
      needsNewReservation,
    };
  }

  /**
   * Create a reservation for new storage from the Walrus system
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
