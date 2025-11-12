"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layouts/AppShell";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletTable } from "@/components/wallet-table";
import { useWalletStorage } from "@/hooks/useWalletStorage";
import { useWalletBlobs } from "@/hooks/useWalletBlobs";
import type { WalletItem } from "@/types/storage";

// Helper function to format storage size
const formatStorageSize = (bytes: bigint): string => {
  const kb = Number(bytes) / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;
  const tb = gb / 1024;

  if (tb >= 1) return `${tb.toFixed(2)} TB`;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  if (kb >= 1) return `${kb.toFixed(2)} KB`;
  return `${Number(bytes)} B`;
};

export default function WalletPage() {
  const {
    objects: storageObjects,
    isLoading: isLoadingStorage,
    error: storageError,
    hasMore: hasMoreStorage,
    loadMore: loadMoreStorage,
  } = useWalletStorage();

  const {
    objects: blobObjects,
    isLoading: isLoadingBlobs,
    error: blobError,
    hasMore: hasMoreBlobs,
    loadMore: loadMoreBlobs,
  } = useWalletBlobs();

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
  return (
    <AppShell>
      <DashboardLayout title="MY WALLET">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black">MY WALLET</h2>

          <Tabs defaultValue="storage" className="w-full">
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
              />
            </TabsContent>

            <TabsContent value="blobs">
              <WalletTable
                items={blobItems}
                isLoading={isLoadingBlobs}
                error={blobError}
                hasMore={hasMoreBlobs}
                onLoadMore={loadMoreBlobs}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AppShell>
  );
}
