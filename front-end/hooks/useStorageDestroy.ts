"use client";

import { useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/lib/config/sui";
import type { WalrusStorage } from "@/types/storage";

interface DestroyStorageParams {
  items: WalrusStorage[];
}

/**
 * Hook to destroy expired storage objects
 *
 * @returns Object with destroyStorage function and loading state
 */
export function useStorageDestroy() {
  const [isDestroying, setIsDestroying] = useState(false);
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

  const walrusPackageId = useNetworkVariable("walrusPackageId");

  const destroyStorage = async ({ items }: DestroyStorageParams) => {
    if (!currentAccount) {
      throw new Error("Wallet not connected");
    }

    if (!walrusPackageId) {
      throw new Error("Walrus Package ID not configured");
    }

    if (items.length === 0) {
      throw new Error("No items selected");
    }

    setIsDestroying(true);

    try {
      const tx = new Transaction();

      // For each expired storage item, call destroy
      for (const item of items) {
        tx.moveCall({
          target: `${walrusPackageId}::storage_resource::destroy`,
          arguments: [
            tx.object(item.objectId), // Storage object to destroy
          ],
        });
      }

      // Sign and execute the transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      return result;
    } finally {
      setIsDestroying(false);
    }
  };

  return {
    destroyStorage,
    isDestroying,
  };
}
