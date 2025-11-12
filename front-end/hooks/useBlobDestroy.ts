"use client";

import { useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/lib/config/sui";
import type { WalrusBlob } from "@/types/storage";

interface DestroyBlobsParams {
  items: WalrusBlob[];
}

export function useBlobDestroy() {
  const [isDestroying, setIsDestroying] = useState(false);
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

  const walrusPackageId = useNetworkVariable("walrusPackageId");

  const destroyBlobs = async ({ items }: DestroyBlobsParams) => {
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

      // For each expired blob item, call burn
      // burn() will destroy both the blob and its internal storage resource
      for (const item of items) {
        tx.moveCall({
          target: `${walrusPackageId}::blob::burn`,
          arguments: [
            tx.object(item.objectId), // Blob object to burn
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
    destroyBlobs,
    isDestroying,
  };
}
