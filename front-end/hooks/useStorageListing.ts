"use client";

import { useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "@/lib/config/sui";
import type { WalrusStorage, WalrusBlob, ItemType } from "@/types/storage";

interface ListStorageParams {
  items: WalrusStorage[] | WalrusBlob[];
  itemType: ItemType;
  pricePerMiBPerEpoch: number; // Price in WAL per MiB per epoch
}

/**
 * Hook to list storage or blob objects for sale on the marketplace
 *
 * @returns Object with listStorage function and loading state
 */
export function useStorageListing() {
  const [isListing, setIsListing] = useState(false);
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();

  const packageId = useNetworkVariable("packageId");
  const marketplaceConfigId = useNetworkVariable("marketplaceConfigId");

  const listStorage = async ({ items, itemType, pricePerMiBPerEpoch }: ListStorageParams) => {
    if (!currentAccount) {
      throw new Error("Wallet not connected");
    }

    if (!packageId || !marketplaceConfigId) {
      throw new Error("Package ID or Marketplace Config ID not configured");
    }

    if (items.length === 0) {
      throw new Error("No items selected");
    }

    setIsListing(true);

    try {
      const tx = new Transaction();

      // For each selected item, call list_storage
      for (const item of items) {
        // Extract storage data based on item type
        const storageData = itemType === 'storage'
          ? (item as WalrusStorage)
          : (item as WalrusBlob).storage;

        // Calculate storage units (MiB) using Walrus SDK formula
        const storageSize = Number(storageData.storageSize);
        const storageUnits = Math.ceil(storageSize / (1024 * 1024)); // MiB

        // Calculate duration in epochs
        const duration = storageData.endEpoch - storageData.startEpoch;

        // Calculate total price in WAL
        const totalPriceInWal = storageUnits * duration * pricePerMiBPerEpoch;

        // Convert WAL to MIST (1 WAL = 1,000,000,000 MIST)
        const totalPriceInMist = Math.floor(totalPriceInWal * 1_000_000_000);

        // Call list_storage function from the marketplace contract
        tx.moveCall({
          target: `${packageId}::marketplace::list_storage`,
          arguments: [
            tx.object(marketplaceConfigId), // Shared marketplace object
            tx.object(item.objectId),        // Storage object to list
            tx.pure.u64(totalPriceInMist),   // Total price in MIST
          ],
        });
      }

      // Sign and execute the transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      return result;
    } finally {
      setIsListing(false);
    }
  };

  return {
    listStorage,
    isListing,
  };
}
