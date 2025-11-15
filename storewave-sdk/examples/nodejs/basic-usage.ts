/**
 * Node.js example for using Storewave SDK
 */

import { WalStorageMarketplace } from 'storewave-sdk';
import { Transaction } from '@mysten/sui/transactions';

// Example wallet address (replace with your own)
const WALLET_ADDRESS = '0x...';

async function main() {
  // Initialize SDK
  const sdk = new WalStorageMarketplace('testnet', {
    backendApiUrl: 'http://localhost:3000',
  });

  console.log('=== Storewave SDK Example ===\n');

  // 1. Get current epoch
  console.log('1. Getting current epoch...');
  const currentEpoch = await sdk.getCurrentEpoch();
  console.log(`Current epoch: ${currentEpoch}\n`);

  // 2. Get WAL balance
  console.log('2. Getting WAL balance...');
  try {
    const balance = await sdk.getWalBalance(WALLET_ADDRESS);
    console.log(`WAL balance: ${balance} FROST (${Number(balance) / 1_000_000_000} WAL)\n`);
  } catch (error) {
    console.error('Error getting balance:', error);
  }

  // 3. Get wallet storage objects
  console.log('3. Getting wallet storage objects...');
  try {
    const storage = await sdk.getWalletStorage({
      address: WALLET_ADDRESS,
      limit: 5,
    });
    console.log(`Found ${storage.data.length} storage object(s):`);
    storage.data.forEach((item, i) => {
      console.log(`  ${i + 1}. Object ID: ${item.objectId}`);
      console.log(`     Size: ${item.storageSize} bytes`);
      console.log(`     Epochs: ${item.startEpoch} - ${item.endEpoch}`);
    });
    console.log();
  } catch (error) {
    console.error('Error getting storage:', error);
  }

  // 4. Get wallet blobs
  console.log('4. Getting wallet blobs...');
  try {
    const blobs = await sdk.getWalletBlobs({
      address: WALLET_ADDRESS,
      limit: 5,
    });
    console.log(`Found ${blobs.data.length} blob(s):`);
    blobs.data.forEach((blob, i) => {
      console.log(`  ${i + 1}. Blob ID: ${blob.blobId}`);
      console.log(`     Size: ${blob.size} bytes`);
      console.log(`     Deletable: ${blob.deletable}`);
    });
    console.log();
  } catch (error) {
    console.error('Error getting blobs:', error);
  }

  // 5. Get marketplace listings
  console.log('5. Getting marketplace listings...');
  try {
    const listings = await sdk.getListingsByAddress({
      address: WALLET_ADDRESS,
      limit: 5,
    });
    console.log(`Found ${listings.data.length} listing(s):`);
    listings.data.forEach((listing, i) => {
      console.log(`  ${i + 1}. Storage ID: ${listing.storageId}`);
      console.log(`     Size: ${listing.size} bytes`);
      console.log(`     Price: ${listing.totalPrice} FROST`);
      console.log(`     Listed at: ${listing.listedAt}`);
    });
    console.log();
  } catch (error) {
    console.error('Error getting listings:', error);
  }

  // 6. Get storage reservation cost
  console.log('6. Getting storage reservation cost...');
  try {
    const cost = await sdk.getReservationCost({
      size: 5,
      sizeUnit: 'GiB',
      durationInEpochs: 100,
    });

    console.log(`Current epoch: ${cost.currentEpoch}`);
    console.log(`End epoch: ${cost.endEpoch}`);
    console.log(`\nOptimized route:`);
    console.log(`  Cost: ${cost.optimizedRoute.totalCostInWal.toFixed(4)} WAL`);
    console.log(`  Uses marketplace: ${cost.optimizedRoute.usesMarketplace}`);
    console.log(`  Operations: ${cost.optimizedRoute.operations.length}`);
    console.log(`\nSystem-only route:`);
    console.log(`  Cost: ${cost.systemOnlyRoute.totalCostInWal.toFixed(4)} WAL`);
    console.log(`  Storage units: ${cost.systemOnlyRoute.storageUnits} MiB`);
    console.log(`\nSavings:`);
    console.log(`  Amount: ${cost.savingsInWal.toFixed(4)} WAL`);
    console.log(`  Percentage: ${cost.savingsPercentage.toFixed(2)}%`);
    console.log(`  Recommendation: ${cost.recommendation}\n`);
  } catch (error) {
    console.error('Error getting cost:', error);
  }

  // 7. Example: Creating a reservation transaction (not executed)
  console.log('7. Creating storage reservation transaction...');
  try {
    const tx = new Transaction();

    const result = await sdk.reserveStorage({
      tx,
      size: 5,
      sizeUnit: 'GiB',
      durationInEpochs: 100,
      senderAddress: WALLET_ADDRESS,
      performDryRun: false, // Skip dry run for this example
    });

    console.log(`Transaction created successfully!`);
    console.log(`Estimated cost: ${result.estimatedCostInWal.toFixed(4)} WAL`);
    console.log(`Current epoch: ${result.currentEpoch}`);
    console.log(`End epoch: ${result.endEpoch}`);
    console.log(`\n(Transaction not executed - would need to sign and submit)\n`);
  } catch (error) {
    console.error('Error creating transaction:', error);
  }

  console.log('=== Example Complete ===');
}

// Run the example
main().catch(console.error);
