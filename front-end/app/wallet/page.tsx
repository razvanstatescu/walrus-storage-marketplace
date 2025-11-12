"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WalletTable } from "@/components/wallet-table";
import { ListStorageDialog } from "@/components/ListStorageDialog";
import { DestroyExpiredDialog } from "@/components/DestroyExpiredDialog";
import { DestroyExpiredBlobsDialog } from "@/components/DestroyExpiredBlobsDialog";
import { useWalletStorage } from "@/hooks/useWalletStorage";
import { useWalletBlobs } from "@/hooks/useWalletBlobs";
import { useWalrusEpoch } from "@/hooks/useWalrusEpoch";
import type { WalletItem, ItemType } from "@/types/storage";

// Helper function to format storage size using Walrus SDK formula
// This matches the Walrus SDK's storage unit calculation
const BYTES_PER_UNIT_SIZE = 1024 * 1024; // 1 MiB

const formatStorageSize = (bytes: bigint): string => {
  const sizeInBytes = Number(bytes);
  const units = Math.ceil(sizeInBytes / BYTES_PER_UNIT_SIZE);

  // Convert to larger units if needed
  const mib = units;
  const gib = mib / 1024;
  const tib = gib / 1024;

  if (tib >= 1) {
    return `${tib.toFixed(2)} TiB (${units.toLocaleString()} MiB)`;
  }
  if (gib >= 1) {
    return `${gib.toFixed(2)} GiB (${units.toLocaleString()} MiB)`;
  }
  return `${mib.toLocaleString()} MiB`;
};

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<ItemType>("storage");
  const [selectedStorageIds, setSelectedStorageIds] = useState<string[]>([]);
  const [selectedBlobIds, setSelectedBlobIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDestroyDialogOpen, setIsDestroyDialogOpen] = useState(false);
  const [isDestroyBlobsDialogOpen, setIsDestroyBlobsDialogOpen] = useState(false);

  const {
    objects: storageObjects,
    isLoading: isLoadingStorage,
    error: storageError,
    hasMore: hasMoreStorage,
    loadMore: loadMoreStorage,
    refresh: refreshStorage,
  } = useWalletStorage();

  const {
    objects: blobObjects,
    isLoading: isLoadingBlobs,
    error: blobError,
    hasMore: hasMoreBlobs,
    loadMore: loadMoreBlobs,
    refresh: refreshBlobs,
  } = useWalletBlobs();

  const { epoch: currentEpoch } = useWalrusEpoch();

  // Convert storage objects to wallet items
  const storageItems: WalletItem[] = useMemo(
    () =>
      storageObjects.map((obj) => ({
        id: obj.objectId,
        objectId: obj.objectId,
        size: formatStorageSize(obj.storageSize),
        startEpoch: obj.startEpoch,
        endEpoch: obj.endEpoch,
      })),
    [storageObjects]
  );

  // Convert blob objects to wallet items
  const blobItems: WalletItem[] = useMemo(
    () =>
      blobObjects.map((obj) => ({
        id: obj.objectId,
        objectId: obj.objectId,
        size: formatStorageSize(obj.storage.storageSize),
        startEpoch: obj.storage.startEpoch,
        endEpoch: obj.storage.endEpoch,
      })),
    [blobObjects]
  );

  // Get selected items for dialog
  const selectedItems = useMemo(() => {
    if (activeTab === "storage") {
      return storageObjects.filter((obj) =>
        selectedStorageIds.includes(obj.objectId)
      );
    } else {
      return blobObjects.filter((obj) => selectedBlobIds.includes(obj.objectId));
    }
  }, [activeTab, selectedStorageIds, selectedBlobIds, storageObjects, blobObjects]);

  // Helper function to check if an item is expired
  const isItemExpired = (startEpoch: number, endEpoch: number) => {
    if (currentEpoch === null) return false;
    return endEpoch <= currentEpoch;
  };

  // Filter selected items into expired and non-expired
  const { expiredStorageItems, expiredBlobItems, nonExpiredItems } = useMemo(() => {
    if (activeTab === "storage") {
      const expired = selectedItems.filter((item) =>
        isItemExpired(item.startEpoch, item.endEpoch)
      );
      const nonExpired = selectedItems.filter((item) =>
        !isItemExpired(item.startEpoch, item.endEpoch)
      );
      return { expiredStorageItems: expired, expiredBlobItems: [], nonExpiredItems: nonExpired };
    } else if (activeTab === "blobs") {
      // For blobs, check expiration using storage.endEpoch
      const expiredBlobs = blobObjects.filter((obj) =>
        selectedBlobIds.includes(obj.objectId) &&
        isItemExpired(obj.storage.startEpoch, obj.storage.endEpoch)
      );
      const nonExpiredBlobs = blobObjects.filter((obj) =>
        selectedBlobIds.includes(obj.objectId) &&
        !isItemExpired(obj.storage.startEpoch, obj.storage.endEpoch)
      );
      // Convert non-expired blobs to storage format for List dialog
      const nonExpiredBlobStorage = nonExpiredBlobs.map((obj) => ({
        objectId: obj.objectId,
        storageSize: obj.storage.storageSize,
        startEpoch: obj.storage.startEpoch,
        endEpoch: obj.storage.endEpoch,
      }));
      return {
        expiredStorageItems: [],
        expiredBlobItems: expiredBlobs,
        nonExpiredItems: nonExpiredBlobStorage
      };
    }
    return { expiredStorageItems: [], expiredBlobItems: [], nonExpiredItems: selectedItems };
  }, [selectedItems, selectedBlobIds, currentEpoch, activeTab, blobObjects]);

  // Get count of selected items for current tab
  const selectedCount =
    activeTab === "storage"
      ? selectedStorageIds.length
      : selectedBlobIds.length;

  // Count of expired and non-expired selections
  const expiredStorageCount = expiredStorageItems.length;
  const expiredBlobsCount = expiredBlobItems.length;
  const nonExpiredCount = nonExpiredItems.length;

  // Handle opening dialog
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  // Handle closing dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Handle opening destroy dialog
  const handleOpenDestroyDialog = () => {
    setIsDestroyDialogOpen(true);
  };

  // Handle closing destroy dialog
  const handleCloseDestroyDialog = () => {
    setIsDestroyDialogOpen(false);
  };

  // Handle opening destroy blobs dialog
  const handleOpenDestroyBlobsDialog = () => {
    setIsDestroyBlobsDialogOpen(true);
  };

  // Handle closing destroy blobs dialog
  const handleCloseDestroyBlobsDialog = () => {
    setIsDestroyBlobsDialogOpen(false);
  };

  // Handle successful listing - refresh storage and clear selections
  const handleListingSuccess = () => {
    // Refresh the appropriate tab
    if (activeTab === "storage") {
      refreshStorage();
      setSelectedStorageIds([]);
    } else {
      refreshBlobs();
      setSelectedBlobIds([]);
    }
  };

  // Handle successful destroy - refresh storage and clear selections
  const handleDestroySuccess = () => {
    refreshStorage();
    setSelectedStorageIds([]);
  };

  // Handle successful blob destroy - refresh blobs and clear selections
  const handleDestroyBlobsSuccess = () => {
    refreshBlobs();
    setSelectedBlobIds([]);
  };

  return (
    <AppShell>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-black">My Wallet</h1>
            <p className="text-gray-600 mt-2">
              Manage your storage objects and blobs
            </p>
          </div>

          <Tabs
            defaultValue="storage"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ItemType)}
            className="w-full"
          >
            <TabsList className="w-full sm:w-auto bg-white/50 border-2 border-[#97f0e5] rounded-xl p-1 mb-6">
              <TabsTrigger
                value="storage"
                className="rounded-lg data-[state=active]:bg-[#97f0e5] data-[state=active]:text-black font-bold cursor-pointer transition-all duration-300 ease-in-out"
              >
                My Storage
              </TabsTrigger>
              <TabsTrigger
                value="blobs"
                className="rounded-lg data-[state=active]:bg-[#97f0e5] data-[state=active]:text-black font-bold cursor-pointer transition-all duration-300 ease-in-out"
              >
                My Blobs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="storage">
              <WalletTable
                items={storageItems}
                isLoading={isLoadingStorage}
                error={storageError}
                hasMore={hasMoreStorage}
                onLoadMore={loadMoreStorage}
                selectedItems={selectedStorageIds}
                onSelectionChange={setSelectedStorageIds}
                currentEpoch={currentEpoch}
                itemType="storage"
              />
            </TabsContent>

            <TabsContent value="blobs">
              <WalletTable
                items={blobItems}
                isLoading={isLoadingBlobs}
                error={blobError}
                hasMore={hasMoreBlobs}
                onLoadMore={loadMoreBlobs}
                selectedItems={selectedBlobIds}
                onSelectionChange={setSelectedBlobIds}
                currentEpoch={currentEpoch}
                itemType="blobs"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Fixed Action Buttons - Side by Side */}
        <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6 flex flex-row gap-3">
          {/* Show Destroy button only on storage tab when expired storage items are selected */}
          {activeTab === "storage" && expiredStorageCount > 0 && (
            <Button
              onClick={handleOpenDestroyDialog}
              variant="outline"
              className="rounded-xl border-2 border-red-500 font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] cursor-pointer hover:bg-red-500/10 hover:text-red-600 hover:shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-6 py-6 text-red-600"
            >
              Destroy Expired ({expiredStorageCount})
            </Button>
          )}

          {/* Show Destroy button only on blobs tab when expired blob items are selected */}
          {activeTab === "blobs" && expiredBlobsCount > 0 && (
            <Button
              onClick={handleOpenDestroyBlobsDialog}
              variant="outline"
              className="rounded-xl border-2 border-red-500 font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] cursor-pointer hover:bg-red-500/10 hover:text-red-600 hover:shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-6 py-6 text-red-600"
            >
              Destroy Expired ({expiredBlobsCount})
            </Button>
          )}

          {/* Show List button when non-expired items are selected */}
          {nonExpiredCount > 0 && (
            <Button
              onClick={handleOpenDialog}
              variant="outline"
              className="rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-6 py-6"
            >
              List Storage ({nonExpiredCount})
            </Button>
          )}
        </div>

        {/* List Storage Dialog */}
        <ListStorageDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          selectedItems={nonExpiredItems}
          itemType={activeTab}
          onSuccess={handleListingSuccess}
        />

        {/* Destroy Expired Storage Dialog */}
        <DestroyExpiredDialog
          isOpen={isDestroyDialogOpen}
          onClose={handleCloseDestroyDialog}
          selectedItems={expiredStorageItems}
          onSuccess={handleDestroySuccess}
        />

        {/* Destroy Expired Blobs Dialog */}
        <DestroyExpiredBlobsDialog
          isOpen={isDestroyBlobsDialogOpen}
          onClose={handleCloseDestroyBlobsDialog}
          selectedItems={expiredBlobItems}
          onSuccess={handleDestroyBlobsSuccess}
        />
      </DashboardLayout>
    </AppShell>
  );
}
