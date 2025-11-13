import { Transaction, TransactionArgument } from "@mysten/sui/transactions";

/**
 * Interfaces matching backend DTOs
 */
export interface ExecutionFlow {
  operationIndex: number;
  type: string;
  producesStorage: boolean;
  storageRef?: string;
  paymentIndex?: number;
  sellerAddress?: string;
  fuseTargets?: {
    first: number;
    second: number;
  };
}

export interface PTBMetadata {
  paymentAmounts: string[]; // WAL amounts in MIST
  executionFlow: ExecutionFlow[];
}

export interface StorageOperation {
  type: string;
  description: string;
  storageObjectId?: string;
  splitSize?: string;
  reserveSize?: string;
  startEpoch?: number;
  endEpoch?: number;
  cost?: string;
}

export interface OptimizationResult {
  operations: StorageOperation[];
  totalCost: string;
  systemOnlyPrice: string;
  allocations: any[];
  needsNewReservation?: any;
  ptbMetadata: PTBMetadata;
}

/**
 * Contract configuration for PTB construction
 */
export interface ContractConfig {
  marketplacePackageId: string;
  marketplaceObjectId: string;
  walrusSystemObjectId: string;
  walrusPackageId: string;
}

/**
 * SIMPLIFIED: Build a Programmable Transaction Block for storage purchase
 *
 * This function constructs a simple PTB that:
 * 1. Merges all user WAL coins into one
 * 2. Splits payment for all operations in a single call
 * 3. Executes buy/reserve operations
 * 4. Fuses all pieces together if multiple
 * 5. Transfers final Storage object to sender
 *
 * Only handles 4 operation types:
 * - buy_full_storage
 * - buy_partial_storage_size
 * - reserve_space
 * - fuse_amount
 *
 * @param optimizationResult - Result from backend optimizer
 * @param walCoinIds - Array of WAL Coin object IDs to use for payment
 * @param contractConfig - Contract addresses and package IDs
 * @param senderAddress - Address to transfer final Storage to
 * @returns Constructed Transaction object ready to sign and execute
 */
export function buildStoragePurchasePTB(
  optimizationResult: OptimizationResult,
  walCoinIds: string[],
  contractConfig: ContractConfig,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  const { operations, ptbMetadata } = optimizationResult;
  const { paymentAmounts, executionFlow } = ptbMetadata;

  // Track Storage results from each operation
  const storageRefs = new Map<number, TransactionArgument>();

  // Step 1: Payment coin handling
  // Merge all WAL coins into one, then split for all payments in single operation
  let paymentCoins: TransactionArgument[] = [];

  if (paymentAmounts.length > 0) {
    if (walCoinIds.length === 0) {
      throw new Error("No WAL coins provided for payment");
    }

    // Merge all coins into the first one
    if (walCoinIds.length > 1) {
      const otherCoins = walCoinIds.slice(1).map((id) => tx.object(id));
      tx.mergeCoins(tx.object(walCoinIds[0]), otherCoins);
    }

    // Single split for ALL payments (avoids coin locking issues)
    const splitCoins = tx.splitCoins(
      tx.object(walCoinIds[0]),
      paymentAmounts.map((amount) => tx.pure.u64(amount)),
    );
    paymentCoins = splitCoins;
  }

  // Step 2: Execute operations in order
  for (const flow of executionFlow) {
    const op = operations[flow.operationIndex];

    switch (op.type) {
      case "buy_full_storage": {
        if (flow.paymentIndex === undefined || !op.storageObjectId) {
          throw new Error(`Invalid buy_full_storage operation at index ${flow.operationIndex}`);
        }

        const storage = tx.moveCall({
          target: `${contractConfig.marketplacePackageId}::marketplace::buy_full_storage`,
          arguments: [
            tx.object(contractConfig.marketplaceObjectId),
            tx.pure.id(op.storageObjectId),
            paymentCoins[flow.paymentIndex],
          ],
        });

        storageRefs.set(flow.operationIndex, storage);
        break;
      }

      case "buy_partial_storage_size": {
        if (flow.paymentIndex === undefined || !op.storageObjectId || !op.splitSize) {
          throw new Error(`Invalid buy_partial_storage_size operation at index ${flow.operationIndex}`);
        }

        const storage = tx.moveCall({
          target: `${contractConfig.marketplacePackageId}::marketplace::buy_partial_storage_size`,
          arguments: [
            tx.object(contractConfig.marketplaceObjectId),
            tx.pure.id(op.storageObjectId),
            tx.pure.u64(op.splitSize),
            paymentCoins[flow.paymentIndex],
          ],
        });

        storageRefs.set(flow.operationIndex, storage);
        break;
      }

      case "reserve_space": {
        if (
          flow.paymentIndex === undefined ||
          !op.reserveSize ||
          op.startEpoch === undefined ||
          op.endEpoch === undefined
        ) {
          throw new Error(`Invalid reserve_space operation at index ${flow.operationIndex}`);
        }

        // Use reserve_space_for_epochs which takes start_epoch and end_epoch directly
        const storage = tx.moveCall({
          target: `${contractConfig.walrusPackageId}::system::reserve_space_for_epochs`,
          arguments: [
            tx.object(contractConfig.walrusSystemObjectId),
            tx.pure.u64(op.reserveSize),
            tx.pure.u32(op.startEpoch),
            tx.pure.u32(op.endEpoch),
            paymentCoins[flow.paymentIndex],
          ],
        });

        // reserve_space_for_epochs uses &mut Coin, so the coin still exists after the call
        // We must transfer it back to sender immediately to avoid UnusedValueWithoutDrop error
        tx.transferObjects([paymentCoins[flow.paymentIndex]] as any, senderAddress);

        storageRefs.set(flow.operationIndex, storage);
        break;
      }

      case "fuse_amount": {
        if (!flow.fuseTargets) {
          throw new Error(`Invalid fuse_amount operation at index ${flow.operationIndex}`);
        }

        const firstStorage = storageRefs.get(flow.fuseTargets.first);
        const secondStorage = storageRefs.get(flow.fuseTargets.second);

        if (!firstStorage || !secondStorage) {
          throw new Error(`Storage references not found for fuse_amount at index ${flow.operationIndex}`);
        }

        tx.moveCall({
          target: `${contractConfig.walrusPackageId}::storage_resource::fuse_amount`,
          arguments: [firstStorage, secondStorage],
        });

        // First storage is modified in place, second is consumed
        storageRefs.delete(flow.fuseTargets.second);
        break;
      }

      default:
        throw new Error(`Unknown operation type: ${op.type} at index ${flow.operationIndex}`);
    }
  }

  // Step 3: Transfer final Storage object to sender
  // The final storage is the last remaining reference (should be at index 0 after all fuses)
  const finalStorageEntry = Array.from(storageRefs.entries()).pop();
  if (!finalStorageEntry) {
    throw new Error("No final storage object found after executing operations");
  }

  const finalStorage = finalStorageEntry[1];
  tx.transferObjects([finalStorage] as any, senderAddress);

  return tx;
}
