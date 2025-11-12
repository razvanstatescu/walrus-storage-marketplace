"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletTable } from "@/components/wallet-table";
import { ListStorageButton } from "@/components/ListStorageButton";
import { ListStorageDialog } from "@/components/ListStorageDialog";
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

  // Get count of selected items for current tab
  const selectedCount =
    activeTab === "storage"
      ? selectedStorageIds.length
      : selectedBlobIds.length;

  // Handle opening dialog
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  // Handle closing dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
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

  return (
    <AppShell>
      <DashboardLayout title="MY WALLET">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black">MY WALLET</h2>

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

        {/* Fixed List Storage Button */}
        <ListStorageButton count={selectedCount} onClick={handleOpenDialog} />

        {/* List Storage Dialog */}
        <ListStorageDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          selectedItems={selectedItems}
          itemType={activeTab}
          onSuccess={handleListingSuccess}
        />
      </DashboardLayout>
    </AppShell>
  );
}
