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
  const walrusPackageId = useNetworkVariable("walrusPackageId");
  const walrusSystemObjectId = useNetworkVariable("walrusSystemObjectId");

  const listStorage = async ({ items, itemType, pricePerMiBPerEpoch }: ListStorageParams) => {
    if (!currentAccount) {
      throw new Error("Wallet not connected");
    }

    if (!packageId || !marketplaceConfigId || !walrusSystemObjectId) {
      throw new Error("Package ID, Marketplace Config ID, or Walrus System Object ID not configured");
    }

    if (itemType === 'blobs' && !walrusPackageId) {
      throw new Error("Walrus Package ID not configured");
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
        let storageData: { storageSize: bigint; startEpoch: number; endEpoch: number };

        if (itemType === 'storage') {
          storageData = item as WalrusStorage;
        } else {
          // Handle both flattened and nested blob formats
          const blob = item as any;

          if ('storageSize' in blob && blob.storageSize !== undefined) {
            // Flattened format (from wallet page transformation)
            storageData = {
              storageSize: blob.storageSize,
              startEpoch: blob.startEpoch,
              endEpoch: blob.endEpoch,
            };
          } else {
            // Nested format (full WalrusBlob object)
            storageData = (blob as WalrusBlob).storage;
          }
        }

        // Calculate storage units (MiB) using Walrus SDK formula
        const storageSize = Number(storageData.storageSize);
        const storageUnits = Math.ceil(storageSize / (1024 * 1024)); // MiB

        // Calculate duration in epochs
        const duration = storageData.endEpoch - storageData.startEpoch;

        // Calculate total price in WAL
        const totalPriceInWal = storageUnits * duration * pricePerMiBPerEpoch;

        // Convert WAL to MIST (1 WAL = 1,000,000,000 MIST)
        const totalPriceInMist = Math.floor(totalPriceInWal * 1_000_000_000);

        if (itemType === 'blobs') {
          // For blobs: first delete the blob to get the storage object
          const [storage] = tx.moveCall({
            target: `${walrusPackageId}::system::delete_blob`,
            arguments: [
              tx.object(walrusSystemObjectId), // Walrus system object
              tx.object(item.objectId),         // Blob to delete
            ],
          });

          // Then list the returned storage object
          tx.moveCall({
            target: `${packageId}::marketplace::list_storage`,
            arguments: [
              tx.object(walrusSystemObjectId), // Walrus system object
              tx.object(marketplaceConfigId),  // Shared marketplace object
              storage,                          // Storage object from delete_blob
              tx.pure.u64(totalPriceInMist),    // Total price in MIST
            ],
          });
        } else {
          // For storage: directly list the storage object
          tx.moveCall({
            target: `${packageId}::marketplace::list_storage`,
            arguments: [
              tx.object(walrusSystemObjectId), // Walrus system object
              tx.object(marketplaceConfigId),  // Shared marketplace object
              tx.object(item.objectId),         // Storage object to list
              tx.pure.u64(totalPriceInMist),    // Total price in MIST
            ],
          });
        }
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
