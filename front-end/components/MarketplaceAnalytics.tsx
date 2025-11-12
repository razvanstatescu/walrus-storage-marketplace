"use client";

import { useMarketplaceAnalytics } from "@/hooks/useMarketplaceAnalytics";
import { formatWalPrice } from "@/lib/utils/storagePrice";

// Helper function to format storage size from bytes
const BYTES_PER_UNIT_SIZE = 1024 * 1024; // 1 MiB

const formatStorageSize = (bytesStr: string): { value: string; unit: string } => {
  const bytes = BigInt(bytesStr);
  const sizeInBytes = Number(bytes);
  const units = Math.ceil(sizeInBytes / BYTES_PER_UNIT_SIZE);

  const mib = units;
  const gib = mib / 1024;
  const tib = gib / 1024;

  if (tib >= 1) {
    return { value: tib.toFixed(2), unit: "TiB" };
  }
  if (gib >= 1) {
    return { value: gib.toFixed(2), unit: "GiB" };
  }
  return { value: mib.toLocaleString(), unit: "MiB" };
};

export function MarketplaceAnalytics() {
  const { analytics, isLoading, error } = useMarketplaceAnalytics();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black">
          Marketplace <span className="text-secondary">Statistics</span>
        </h2>
        <p className="text-gray-600 mt-2">
          Real-time analytics from the Walrus storage marketplace
        </p>
      </div>

      {/* Stats Cards */}
      {error ? (
        <div className="backdrop-blur-md bg-white/80 border-2 border-red-500 rounded-xl p-6 text-center">
          <p className="text-red-500">Error loading analytics: {error}</p>
        </div>
      ) : isLoading || !analytics ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4"
            >
              <div className="text-sm text-gray-600">Loading...</div>
              <div className="text-2xl font-bold mt-1">--</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Active Listings */}
          <div className="backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4">
            <div className="text-sm text-gray-600">Active Listings</div>
            <div className="text-2xl font-bold mt-1">
              {analytics.totalActiveListings.toLocaleString()}
            </div>
          </div>

          {/* Card 2: Total Value Listed */}
          <div className="backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4">
            <div className="text-sm text-gray-600">Total Value Listed</div>
            <div className="text-2xl font-bold mt-1">
              <span className="text-black">
                {formatWalPrice(BigInt(analytics.totalValueListed), 4)}
              </span>{" "}
              <span className="text-secondary">WAL</span>
            </div>
          </div>

          {/* Card 3: Storage Available */}
          <div className="backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4">
            <div className="text-sm text-gray-600">Storage Available</div>
            <div className="text-2xl font-bold mt-1">
              <span className="text-black">
                {formatStorageSize(analytics.totalSizeListed).value}
              </span>{" "}
              <span className="text-secondary">
                {formatStorageSize(analytics.totalSizeListed).unit}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
