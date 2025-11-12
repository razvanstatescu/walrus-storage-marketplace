"use client";

import { useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

interface DelistStorageParams {
  storageIds: string[];
  onSuccess?: () => void;
}

/**
 * Hook to handle delisting storage from the marketplace
 * Builds a PTB that:
 * 1. Delists each storage object from marketplace
 * 2. Transfers delisted storage back to owner
 */
export function useStorageDelisting() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [isDelisting, setIsDelisting] = useState(false);

  const delistStorage = async ({ storageIds, onSuccess }: DelistStorageParams) => {
    if (!currentAccount?.address) {
      throw new Error("Wallet not connected");
    }

    if (storageIds.length === 0) {
      throw new Error("No storage items selected");
    }

    setIsDelisting(true);

    try {
      const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
      const marketplaceConfigId = process.env.NEXT_PUBLIC_MARKETPLACE_CONFIG_ID;

      if (!packageId || !marketplaceConfigId) {
        throw new Error("Missing environment variables");
      }

      const tx = new Transaction();

      // Delist each storage object and collect the returned Storage objects
      const delistedStorageObjects = storageIds.map((storageId) => {
        return tx.moveCall({
          target: `${packageId}::marketplace::delist_storage`,
          arguments: [
            tx.object(marketplaceConfigId),
            tx.pure.id(storageId),
          ],
        });
      });

      // Transfer all delisted storage objects back to the owner
      tx.transferObjects(delistedStorageObjects, currentAccount.address);

      // Execute the transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("Delist transaction result:", result);

      // Call success callback
      onSuccess?.();

      return result;
    } finally {
      setIsDelisting(false);
    }
  };

  return {
    delistStorage,
    isDelisting,
  };
}
