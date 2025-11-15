/**
 * Programmable Transaction Block (PTB) builder for storage operations
 */

import { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
import type { NetworkConfig } from '../config/networks.js';
import type { Operation, OptimizationResult } from '../types/index.js';
import { ValidationError } from '../types/index.js';

/**
 * Build PTB for storage purchase operations
 *
 * @param tx - Transaction object to modify
 * @param optimizationResult - Result from optimization API
 * @param walCoinIds - Array of WAL coin object IDs
 * @param senderAddress - Address of the transaction sender
 * @param config - Network configuration
 * @returns Modified transaction object
 */
export function buildStoragePurchasePTB(
  tx: Transaction,
  optimizationResult: OptimizationResult,
  walCoinIds: string[],
  senderAddress: string,
  config: NetworkConfig,
): Transaction {
  if (walCoinIds.length === 0) {
    throw new ValidationError('No WAL coins provided');
  }

  const { operations, ptbMetadata } = optimizationResult;
  const paymentAmounts = ptbMetadata.paymentAmounts.map((amount) => BigInt(amount));

  // Step 1: Merge all WAL coins into one
  if (walCoinIds.length > 1) {
    const otherCoins = walCoinIds.slice(1).map((id) => tx.object(id));
    tx.mergeCoins(tx.object(walCoinIds[0]), otherCoins);
  }

  // Step 2: Split coins for all payments
  const splitCoins = tx.splitCoins(
    tx.object(walCoinIds[0]),
    paymentAmounts.map((amount) => tx.pure.u64(amount)),
  );

  // Step 3: Execute operations and collect storage results
  const storageResults: any[] = [];
  let paymentIndex = 0;

  for (const operation of operations) {
    const result = executeOperation(
      tx,
      operation,
      splitCoins,
      paymentIndex,
      senderAddress,
      config,
      storageResults,
    );

    if (result) {
      storageResults.push(result);
    }

    // Increment payment index for operations that require payment
    if (operation.type !== 'fuse_amount') {
      paymentIndex++;
    }
  }

  // Step 4: Transfer final storage to sender
  if (storageResults.length > 0) {
    const finalStorage = storageResults[storageResults.length - 1];
    tx.transferObjects([finalStorage], senderAddress);
  }

  return tx;
}

/**
 * Execute a single operation in the PTB
 */
function executeOperation(
  tx: Transaction,
  operation: Operation,
  paymentCoins: any,
  paymentIndex: number,
  senderAddress: string,
  config: NetworkConfig,
  storageResults: any[],
): any {
  switch (operation.type) {
    case 'buy_full_storage': {
      const storage = tx.moveCall({
        target: `${config.marketplacePackageId}::marketplace::buy_full_storage`,
        arguments: [
          tx.object(config.marketplaceConfigId),
          tx.pure.id(operation.storageObjectId),
          paymentCoins[paymentIndex],
        ],
      });
      return storage;
    }

    case 'buy_partial_storage_size': {
      const storage = tx.moveCall({
        target: `${config.marketplacePackageId}::marketplace::buy_partial_storage_size`,
        arguments: [
          tx.object(config.marketplaceConfigId),
          tx.pure.id(operation.storageObjectId),
          tx.pure.u64(BigInt(operation.size)),
          paymentCoins[paymentIndex],
        ],
      });
      return storage;
    }

    case 'reserve_space': {
      const storage = tx.moveCall({
        target: `${config.walrusPackageId}::system::reserve_space_for_epochs`,
        arguments: [
          tx.object(config.walrusSystemObjectId),
          tx.pure.u64(BigInt(operation.reserveSize)),
          tx.pure.u32(operation.startEpoch),
          tx.pure.u32(operation.endEpoch),
          paymentCoins[paymentIndex],
        ],
      });

      // IMPORTANT: Transfer payment coin back to sender
      // reserve_space uses &mut Coin, so we need to return it
      tx.transferObjects([paymentCoins[paymentIndex]], senderAddress);

      return storage;
    }

    case 'fuse_amount': {
      const storage1 = storageResults[operation.storage1Index];
      const storage2 = storageResults[operation.storage2Index];

      if (!storage1 || !storage2) {
        throw new ValidationError(
          `Invalid fuse operation: storage indices ${operation.storage1Index} and ${operation.storage2Index} not found`,
        );
      }

      const fusedStorage = tx.moveCall({
        target: `${config.walrusPackageId}::storage_resource::fuse_amount`,
        arguments: [storage1, storage2],
      });

      // Update the result at storage1Index to be the fused storage
      storageResults[operation.storage1Index] = fusedStorage;

      return fusedStorage;
    }

    default:
      throw new ValidationError(`Unknown operation type: ${(operation as any).type}`);
  }
}

/**
 * Build PTB for listing storage on marketplace
 *
 * @param tx - Transaction object to modify
 * @param storageObjectIds - Array of storage object IDs to list
 * @param pricesInFrost - Corresponding prices in FROST
 * @param config - Network configuration
 * @returns Modified transaction object
 */
export function buildListStoragePTB(
  tx: Transaction,
  storageObjectIds: string[],
  pricesInFrost: bigint[],
  config: NetworkConfig,
): Transaction {
  if (storageObjectIds.length !== pricesInFrost.length) {
    throw new ValidationError('Number of storage objects must match number of prices');
  }

  for (let i = 0; i < storageObjectIds.length; i++) {
    tx.moveCall({
      target: `${config.marketplacePackageId}::marketplace::list_storage`,
      arguments: [
        tx.object(config.walrusSystemObjectId),
        tx.object(config.marketplaceConfigId),
        tx.object(storageObjectIds[i]),
        tx.pure.u64(pricesInFrost[i]),
      ],
    });
  }

  return tx;
}

/**
 * Build PTB for listing blobs as storage on marketplace
 * First deletes the blob to get storage, then lists it
 *
 * @param tx - Transaction object to modify
 * @param blobObjectIds - Array of blob object IDs to list
 * @param pricesInFrost - Corresponding prices in FROST
 * @param config - Network configuration
 * @returns Modified transaction object
 */
export function buildListBlobAsStoragePTB(
  tx: Transaction,
  blobObjectIds: string[],
  pricesInFrost: bigint[],
  config: NetworkConfig,
): Transaction {
  if (blobObjectIds.length !== pricesInFrost.length) {
    throw new ValidationError('Number of blob objects must match number of prices');
  }

  for (let i = 0; i < blobObjectIds.length; i++) {
    // Delete blob to get storage
    const [storage] = tx.moveCall({
      target: `${config.walrusPackageId}::system::delete_blob`,
      arguments: [tx.object(config.walrusSystemObjectId), tx.object(blobObjectIds[i])],
    });

    // List the storage
    tx.moveCall({
      target: `${config.marketplacePackageId}::marketplace::list_storage`,
      arguments: [
        tx.object(config.walrusSystemObjectId),
        tx.object(config.marketplaceConfigId),
        storage,
        tx.pure.u64(pricesInFrost[i]),
      ],
    });
  }

  return tx;
}

/**
 * Perform dry run simulation of a transaction
 *
 * @param tx - Transaction to simulate
 * @param suiClient - Sui client instance
 * @param senderAddress - Address of the transaction sender
 * @returns Dry run result with success status and error message
 */
export async function dryRunPTB(
  tx: Transaction,
  suiClient: SuiClient,
  senderAddress: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Clone the transaction to avoid modifying the original
    const clonedTx = Transaction.from(tx.serialize());
    clonedTx.setSender(senderAddress);

    const result = await suiClient.dryRunTransactionBlock({
      transactionBlock: await clonedTx.build({ client: suiClient }),
    });

    return {
      success: result.effects.status.status === 'success',
      error: result.effects.status.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during dry run',
    };
  }
}
