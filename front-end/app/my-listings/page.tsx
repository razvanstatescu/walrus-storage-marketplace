"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layouts/AppShell";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { WalletTable } from "@/components/wallet-table";
import { DelistStorageButton } from "@/components/DelistStorageButton";
import { useMarketplaceListings } from "@/hooks/useMarketplaceListings";
import { useWalrusEpoch } from "@/hooks/useWalrusEpoch";
import type { WalletItem } from "@/types/storage";

// Helper function to format storage size using Walrus SDK formula
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

// Helper function to format WAL price
const formatWalPrice = (mist: bigint): string => {
  const wal = Number(mist) / 1_000_000_000;
  return wal.toFixed(6);
};

export default function MyListingsPage() {
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);

  const {
    listings,
    isLoading,
    error,
    refetch,
  } = useMarketplaceListings();

  const { epoch: currentEpoch } = useWalrusEpoch();

  // Convert listings to wallet items for table display
  const listingItems: WalletItem[] = useMemo(
    () =>
      listings.map((listing) => ({
        id: listing.storageId,
        objectId: listing.storageId,
        size: formatStorageSize(listing.size),
        startEpoch: listing.startEpoch,
        endEpoch: listing.endEpoch,
      })),
    [listings]
  );

  // Handle selection changes
  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedListingIds(selectedIds);
  };

  // Handle successful delisting
  const handleDelistSuccess = () => {
    setSelectedListingIds([]);
    refetch();
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedListingIds([]);
  };

  return (
    <AppShell>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-black">My Listings</h1>
              <p className="text-gray-600 mt-2">
                Manage your active marketplace listings
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {selectedListingIds.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearSelection}
                  className="rounded-xl border-2 border-gray-300 font-bold shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] hover:shadow-[2px_2px_0px_0px_rgba(200,200,200,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Clear Selection
                </Button>
              )}
              <DelistStorageButton
                selectedStorageIds={selectedListingIds}
                onSuccess={handleDelistSuccess}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4">
              <div className="text-sm text-gray-600">Active Listings</div>
              <div className="text-2xl font-bold mt-1">
                {listings.length}
              </div>
            </div>

            <div className="backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4">
              <div className="text-sm text-gray-600">Selected</div>
              <div className="text-2xl font-bold mt-1">
                {selectedListingIds.length}
              </div>
            </div>

            <div className="backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4">
              <div className="text-sm text-gray-600">Total Value</div>
              <div className="text-2xl font-bold mt-1">
                {formatWalPrice(
                  listings.reduce((sum, l) => sum + l.totalPrice, 0n)
                )}{" "}
                WAL
              </div>
            </div>
          </div>

          {/* Listings Table */}
          {error ? (
            <div className="backdrop-blur-md bg-white/80 border-2 border-[#97f0e5] rounded-xl shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] p-6">
              <div className="text-center py-12">
                <p className="text-red-500">Error loading listings: {error}</p>
                <Button
                  onClick={refetch}
                  className="mt-4 rounded-xl border-2 border-[#97f0e5] bg-[#97f0e5]/50"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="backdrop-blur-md bg-white/80 border-2 border-[#97f0e5] rounded-xl shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] p-6">
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#97f0e5] border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading your listings...</p>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="backdrop-blur-md bg-white/80 border-2 border-[#97f0e5] rounded-xl shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] p-6">
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-semibold">No active listings</h3>
                <p className="mt-2 text-gray-600">
                  You don't have any storage listed on the marketplace yet.
                </p>
                <Link href="/wallet">
                  <Button className="mt-6 rounded-xl border-2 border-[#97f0e5] bg-[#97f0e5]/50 font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    List Storage Now
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <WalletTable
              items={listingItems}
              selectedItems={selectedListingIds}
              onSelectionChange={handleSelectionChange}
              currentEpoch={currentEpoch}
            />
          )}
        </div>
      </DashboardLayout>
    </AppShell>
  );
}
