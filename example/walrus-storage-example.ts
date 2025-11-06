import {
  WalrusStorageOptimizer,
  StorageObject,
  StorageRequest,
  StorageOperation,
  generateStorageOperations
} from './walrus-storage-optimizer';

// Example usage
async function main() {
  // Mock storage objects in your database
  // Note: All prices are in FROST (1 WAL = 1,000,000,000 FROST)
  // Scenario: Mix of fully and partially used storage objects
  const FROST = 1_000_000_000n;
  const storageObjectsInDB: StorageObject[] = [
    {
      id: 'storage_1',
      startEpoch: 130,
      endEpoch: 170,  // Matches our request period exactly
      storageSize: BigInt(1024 * 256), // 256KB
      price: 5_000_000n,  // 0.005 WAL (cheap! worth using - FULLY USED)
      owner: '0x1234...seller1'
    },
    {
      id: 'storage_2',
      startEpoch: 120,  // Starts earlier than our request
      endEpoch: 180,    // Ends later than our request
      storageSize: BigInt(1024 * 512), // 512KB - but we only need 256KB
      price: 20_000_000n,  // 0.020 WAL total price
      owner: '0x5678...seller2'
      // PARTIALLY USED: Only using 256KB out of 512KB (50% of size)
      // AND only using epochs 130-170 (40 epochs) out of 120-180 (60 epochs) = 66.67% of duration
      // Seller gets: 50% × 66.67% = 33.33% of price = ~6,666,666 FROST instead of 20,000,000 FROST
    },
    {
      id: 'storage_3',
      startEpoch: 130,
      endEpoch: 170,  // Matches our request period exactly
      storageSize: BigInt(1024 * 128), // 128KB
      price: 100n * FROST,  // 100 WAL (very expensive! won't use)
      owner: '0xabcd...seller3'
    },
    {
      id: 'storage_4',
      startEpoch: 130,
      endEpoch: 170,  // Matches our request period exactly
      storageSize: BigInt(1024 * 512), // 512KB
      price: 300n * FROST,  // 300 WAL (very expensive! won't use)
      owner: '0xef01...seller4'
    }
  ];

  // Expected cost breakdown:
  // - Use storage_1 (256KB, fully used): seller gets 100% of price = 5,000,000 FROST
  // - Use storage_2 (256KB out of 512KB, 40 epochs out of 60):
  //   Seller gets: (256/512) × (40/60) × 20,000,000 = 0.5 × 0.667 × 20,000,000 = ~6,666,666 FROST
  //   (NOT the full 20,000,000 FROST!)
  // - Buy remaining 512KB (0.5 MiB) for 40 epochs from system:
  //   = 0.0093 WAL (metadata) + (0.5 MiB × 0.0009 WAL × 40 epochs)
  //   = 0.0093 + 0.018 = 0.0273 WAL = 27,300,000 FROST
  // - Total cost: 5,000,000 + 6,666,666 + 27,300,000 = ~38,966,666 FROST (0.0390 WAL)
  //
  // Compare to buying 1MB entirely from system:
  // - = 0.0093 + (1 MiB × 0.0009 × 40) = 0.0453 WAL = 45,300,000 FROST
  //
  // Hybrid with partial usage is CHEAPER! (~39M vs 45.3M FROST)

  // Storage cost function matching Walrus testnet pricing
  // Based on testnet data: metadata = 0.0093 WAL, marginal = 0.0009 WAL per MiB per epoch
  const storageCostFunction = async (size: number, epochs: number) => {
    const FROST_TO_WAL = 1_000_000_000; // 1 WAL = 1,000,000,000 FROST
    const METADATA_COST_WAL = 0.0093; // Fixed metadata cost per blob
    const MARGINAL_COST_PER_MIB_PER_EPOCH = 0.0009; // WAL per MiB per epoch

    const sizeInMiB = size / (1024 * 1024); // Convert bytes to MiB

    // Total cost = metadata + (size in MiB × marginal price × epochs)
    const totalCostWAL = METADATA_COST_WAL + (sizeInMiB * MARGINAL_COST_PER_MIB_PER_EPOCH * epochs);

    // Convert to smallest unit (FROST) then to bigint
    const storageCost = BigInt(Math.floor(totalCostWAL * FROST_TO_WAL));

    return { storageCost };
  };

  // Initialize the optimizer
  const optimizer = new WalrusStorageOptimizer(storageObjectsInDB, storageCostFunction);

  // Example request: 1MB from epoch 130 to 170
  const request: StorageRequest = {
    size: BigInt(1024 * 1024), // 1MB
    startEpoch: 130,
    endEpoch: 170
  };

  console.log('Storage Request:');
  console.log(`- Size: ${Number(request.size) / (1024 * 1024)}MB`);
  console.log(`- Period: Epoch ${request.startEpoch} to ${request.endEpoch}`);
  console.log('');

  // Find optimal allocation
  const result = await optimizer.findOptimalAllocation(request);

  // Calculate what it would cost to buy everything from system for comparison
  const systemOnlyCost = await storageCostFunction(Number(request.size), request.endEpoch - request.startEpoch);
  const savings = systemOnlyCost.storageCost - result.totalCost;
  const savingsPercentage = (Number(savings) / Number(systemOnlyCost.storageCost) * 100).toFixed(1);

  console.log('Optimal Allocation Result:');
  console.log(`Strategy Used: ${result.allocations.length === 0 ? 'Reserve-Only (System Purchase)' : result.needsNewReservation ? 'Hybrid (DB + System)' : 'DB-Only (Marketplace)'}`);
  console.log(`Total Cost: ${result.totalCost} FROST (${Number(result.totalCost) / 1_000_000_000} WAL)`);
  console.log('');
  console.log('Cost Comparison:');
  console.log(`- Optimized Strategy: ${result.totalCost} FROST (${Number(result.totalCost) / 1_000_000_000} WAL)`);
  console.log(`- System-Only Purchase: ${systemOnlyCost.storageCost} FROST (${Number(systemOnlyCost.storageCost) / 1_000_000_000} WAL)`);
  console.log(`- Savings: ${savings} FROST (${Number(savings) / 1_000_000_000} WAL) = ${savingsPercentage}% cheaper`);
  console.log('');

  if (result.allocations.length > 0) {
    console.log('Source Allocations:');
    result.allocations.forEach((allocation, index) => {
      const storage = allocation.storageObject;
      const sizePercentage = (Number(allocation.usedSize) / Number(storage.storageSize) * 100).toFixed(1);
      const totalEpochs = storage.endEpoch - storage.startEpoch;
      const usedEpochs = allocation.usedEndEpoch - allocation.usedStartEpoch;
      const epochPercentage = (usedEpochs / totalEpochs * 100).toFixed(1);
      const paymentPercentage = (Number(allocation.sellerPayment) / Number(storage.price) * 100).toFixed(1);

      console.log(`${index + 1}. Storage Object: ${storage.id}`);
      console.log(`   - Total Object: ${Number(storage.storageSize) / (1024 * 1024)}MB, epochs ${storage.startEpoch}-${storage.endEpoch}, price ${storage.price} FROST`);
      console.log(`   - Used Size: ${Number(allocation.usedSize) / (1024 * 1024)}MB (${sizePercentage}% of object)`);
      console.log(`   - Used Period: Epoch ${allocation.usedStartEpoch} to ${allocation.usedEndEpoch} (${epochPercentage}% of object duration)`);
      console.log(`   - Cost: ${allocation.cost} FROST (${Number(allocation.cost) / 1_000_000_000} WAL)`);
      if (allocation.seller) {
        console.log(`   - Seller: ${allocation.seller}`);
        console.log(`   - Seller Payment: ${allocation.sellerPayment} FROST (${Number(allocation.sellerPayment) / 1_000_000_000} WAL) = ${paymentPercentage}% of total price`);
      }
    });
  }

  if (result.needsNewReservation) {
    console.log('');
    console.log('New Reservation Required:');
    console.log(`- Size: ${Number(result.needsNewReservation.size) / (1024 * 1024)}MB`);
    console.log(`- Epochs: ${result.needsNewReservation.epochs}`);
    console.log(`- Cost: ${result.needsNewReservation.cost} FROST (${Number(result.needsNewReservation.cost) / 1_000_000_000} WAL)`);
  }

  // Generate operations to create single Storage object
  console.log('');
  console.log('='.repeat(80));
  console.log('Operations to Create Single Storage Object:');
  console.log('='.repeat(80));
  const operations = generateStorageOperations(
    result,
    request.startEpoch,
    request.endEpoch,
    request.size
  );
  operations.forEach((op, index) => {
    console.log(`${index + 1}. ${op.description}`);
  });
}

// Advanced example with database integration
class StorageMarketplace {
  private optimizer: WalrusStorageOptimizer;
  private db: any; // Your database connection

  constructor(db: any, storageCostFn: (size: number, epochs: number) => Promise<{ storageCost: bigint }>) {
    this.db = db;
    this.optimizer = new WalrusStorageOptimizer([], storageCostFn);
  }

  async findBestStorageDeal(
    sizeInMB: number,
    startEpoch: number,
    endEpoch: number
  ): Promise<{
    allocations: any[];
    totalCost: bigint;
    operations: StorageOperation[];
  }> {
    // Fetch available storage objects from database
    const storageObjects = await this.fetchAvailableStorage(startEpoch, endEpoch);

    // Update optimizer with current storage objects
    this.optimizer = new WalrusStorageOptimizer(
      storageObjects,
      this.storageCostFunction.bind(this)
    );

    // Create request
    const request: StorageRequest = {
      size: BigInt(sizeInMB * 1024 * 1024),
      startEpoch,
      endEpoch
    };

    // Find optimal allocation
    const result = await this.optimizer.findOptimalAllocation(request);

    // Generate operations to create single Storage object
    const operations = generateStorageOperations(result, startEpoch, endEpoch, request.size);

    // Mark allocated storage as reserved in database
    await this.markStorageAsAllocated(result.allocations);

    return {
      allocations: result.allocations.map(a => ({
        storageId: a.storageObject.id,
        usedSize: Number(a.usedSize),
        usedStartEpoch: a.usedStartEpoch,
        usedEndEpoch: a.usedEndEpoch,
        cost: a.cost.toString()
      })),
      totalCost: result.totalCost,
      operations
    };
  }

  private async fetchAvailableStorage(
    startEpoch: number,
    endEpoch: number
  ): Promise<StorageObject[]> {
    // Query your database for available storage objects
    // This is a placeholder - implement according to your DB schema
    const query = `
      SELECT id, start_epoch, end_epoch, storage_size, price
      FROM storage_objects
      WHERE status = 'available'
        AND end_epoch > ?
        AND start_epoch < ?
      ORDER BY price / storage_size ASC
    `;

    const results = await this.db.query(query, [startEpoch, endEpoch]);

    return results.map((row: any) => ({
      id: row.id,
      startEpoch: row.start_epoch,
      endEpoch: row.end_epoch,
      storageSize: BigInt(row.storage_size),
      price: BigInt(row.price)
    }));
  }

  private async markStorageAsAllocated(allocations: any[]): Promise<void> {
    // Update database to mark storage as allocated
    // This is a placeholder - implement according to your needs
    for (const allocation of allocations) {
      await this.db.query(
        'UPDATE storage_objects SET status = ? WHERE id = ?',
        ['allocated', allocation.storageObject.id]
      );
    }
  }

  private async storageCostFunction(size: number, epochs: number): Promise<{ storageCost: bigint }> {
    // Call your actual storageCost method here
    // This should integrate with your front-end method
    // For example:
    // const result = await this.walrusClient.storageCost(size, epochs);
    // return { storageCost: result.storageCost };

    // Walrus testnet pricing formula
    const FROST_TO_WAL = 1_000_000_000; // 1 WAL = 1,000,000,000 FROST
    const METADATA_COST_WAL = 0.0093; // Fixed metadata cost per blob
    const MARGINAL_COST_PER_MIB_PER_EPOCH = 0.0009; // WAL per MiB per epoch

    const sizeInMiB = size / (1024 * 1024); // Convert bytes to MiB

    // Total cost = metadata + (size in MiB × marginal price × epochs)
    const totalCostWAL = METADATA_COST_WAL + (sizeInMiB * MARGINAL_COST_PER_MIB_PER_EPOCH * epochs);

    // Convert to smallest unit (FROST) then to bigint
    const storageCost = BigInt(Math.floor(totalCostWAL * FROST_TO_WAL));

    return { storageCost };
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { StorageMarketplace };
