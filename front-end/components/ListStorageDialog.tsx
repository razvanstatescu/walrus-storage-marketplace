"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalrusStorageCost } from "@/hooks/useWalrusStorageCost";
import { useStorageListing } from "@/hooks/useStorageListing";
import { toast } from "@/hooks/use-toast";
import {
  calculateTotalPrice,
  calculateTotalUnits,
  formatPrice,
  formatWalPrice,
  storageUnitsFromSize,
  calculateItemDuration,
} from "@/lib/utils/storagePrice";
import {
  calculateSuggestedPricePerUnit,
  getCompetitivenessScore,
  formatPriceDifference,
} from "@/lib/utils/pricingSuggestions";
import type { WalrusStorage, WalrusBlob, ItemType } from "@/types/storage";

interface ListStorageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: WalrusStorage[] | WalrusBlob[];
  itemType: ItemType;
  onSuccess?: () => void;
}

export function ListStorageDialog({
  isOpen,
  onClose,
  selectedItems,
  itemType,
  onSuccess,
}: ListStorageDialogProps) {
  const [pricePerMiBPerEpoch, setPricePerMiBPerEpoch] = useState<string>("");
  const [itemSystemCosts, setItemSystemCosts] = useState<number[]>([]);
  const { calculateBatchCosts, isLoading: isLoadingSystemCost } = useWalrusStorageCost();
  const { listStorage, isListing } = useStorageListing();

  // Convert items to storage data format
  const storageData = useMemo(() => {
    return selectedItems.map((item) => {
      if (itemType === 'storage') {
        const storage = item as WalrusStorage;
        return {
          objectId: storage.objectId,
          storageSize: storage.storageSize,
          startEpoch: storage.startEpoch,
          endEpoch: storage.endEpoch,
        };
      } else {
        // Handle both flattened and nested blob formats
        const blob = item as any;

        // Check if already flattened (has storageSize at top level)
        if ('storageSize' in blob && blob.storageSize !== undefined) {
          return {
            objectId: blob.objectId,
            storageSize: blob.storageSize,
            startEpoch: blob.startEpoch,
            endEpoch: blob.endEpoch,
          };
        }

        // Otherwise expect nested storage property
        return {
          objectId: blob.objectId,
          storageSize: blob.storage?.storageSize,
          startEpoch: blob.storage?.startEpoch,
          endEpoch: blob.storage?.endEpoch,
        };
      }
    });
  }, [selectedItems, itemType]);

  // Calculate actual system costs for each item (accurate pricing, not linear approximation)
  useEffect(() => {
    if (isOpen && storageData.length > 0) {
      const batchItems = storageData.map((item) => ({
        sizeBytes: Number(item.storageSize), // Convert BigInt to Number
        epochs: item.endEpoch - item.startEpoch,
      }));

      calculateBatchCosts(batchItems)
        .then((results) => {
          const costs = results.map((result) => Number(result.storageCost) / 1_000_000_000); // Convert FROST to WAL
          setItemSystemCosts(costs);
        })
        .catch((error) => {
          console.error("Failed to calculate system costs:", error);
          setItemSystemCosts([]);
        });
    }
  }, [isOpen, storageData, calculateBatchCosts]);

  // Calculate totals
  const totalUnits = useMemo(() => {
    return calculateTotalUnits(storageData);
  }, [storageData]);

  const totalUserPrice = useMemo(() => {
    const price = parseFloat(pricePerMiBPerEpoch);
    if (isNaN(price) || price <= 0) return 0;
    return calculateTotalPrice(storageData, price);
  }, [storageData, pricePerMiBPerEpoch]);

  // Calculate accurate total system price (sum of per-item actual costs)
  const totalSystemPrice = useMemo(() => {
    if (itemSystemCosts.length === 0) return null;
    return itemSystemCosts.reduce((sum, cost) => sum + cost, 0);
  }, [itemSystemCosts]);

  // Calculate suggested competitive price
  const suggestedPricePerUnit = useMemo(() => {
    if (!totalSystemPrice || totalUnits === 0) return null;
    const totalEpochs = storageData.reduce((sum, item) => sum + (item.endEpoch - item.startEpoch), 0);
    return calculateSuggestedPricePerUnit(totalSystemPrice, totalUnits, totalEpochs);
  }, [totalSystemPrice, totalUnits, storageData]);

  // Calculate percentage difference from system price
  const priceDifferencePercent = useMemo(() => {
    if (!totalSystemPrice || !totalUserPrice || totalUserPrice === 0) return null;
    const difference = ((totalUserPrice - totalSystemPrice) / totalSystemPrice) * 100;
    return difference;
  }, [totalSystemPrice, totalUserPrice]);

  // Calculate competitiveness score
  const competitivenessScore = useMemo(() => {
    if (!totalSystemPrice || !totalUserPrice || totalUserPrice === 0) return null;
    return getCompetitivenessScore(totalUserPrice, totalSystemPrice);
  }, [totalUserPrice, totalSystemPrice]);

  // Format price difference text
  const priceDifferenceText = useMemo(() => {
    if (priceDifferencePercent === null) return null;
    return formatPriceDifference(priceDifferencePercent);
  }, [priceDifferencePercent]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-[#97f0e5] shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            {itemType === 'storage' ? 'List Storage for Sale' : 'List Blobs for Sale'}
          </DialogTitle>
          <DialogDescription>
            You have selected {selectedItems.length} {itemType === 'storage' ? 'storage unit' : 'blob'}
            {selectedItems.length !== 1 ? 's' : ''} to list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Items Summary */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Selected Items</h3>
            <div className="max-h-48 overflow-y-auto space-y-2 backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4">
              {storageData.map((item, index) => {
                const units = storageUnitsFromSize(item.storageSize);
                const duration = calculateItemDuration(item.startEpoch, item.endEpoch);
                return (
                  <div
                    key={item.objectId}
                    className="flex justify-between items-center text-sm border-b border-[#97f0e5]/20 pb-2 last:border-0"
                  >
                    <div>
                      <span className="font-mono">
                        {item.objectId.slice(0, 6)}...{item.objectId.slice(-4)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{units} MiB</div>
                      <div className="text-xs text-gray-600">{duration} epochs</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Price */}
          {suggestedPricePerUnit !== null && !isLoadingSystemCost && (
            <div className="backdrop-blur-md bg-green-50 border-2 border-green-500 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-green-700 flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="break-words">Suggested Competitive Price</span>
                  </h3>
                  <p className="text-sm text-green-600 mt-1 break-words">
                    {formatPrice(suggestedPricePerUnit)} WAL/MiB/epoch (10% below system price)
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setPricePerMiBPerEpoch(suggestedPricePerUnit.toFixed(6))}
                  className="w-full sm:w-auto rounded-xl border-2 border-green-500 bg-green-500/50 font-bold shadow-[2px_2px_0px_0px_rgba(34,197,94,1)] hover:bg-green-500/30 hover:shadow-[1px_1px_0px_0px_rgba(34,197,94,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-black text-sm px-3 py-1.5 h-auto whitespace-nowrap"
                >
                  Use This Price
                </Button>
              </div>
            </div>
          )}

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="price" className="font-bold">
              Your price per storage unit (MiB per epoch)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.0001"
              min="0"
              placeholder="0.0000"
              value={pricePerMiBPerEpoch}
              onChange={(e) => setPricePerMiBPerEpoch(e.target.value)}
              className="border-2 border-[#97f0e5] rounded-xl focus:ring-[#97f0e5]"
            />
            <p className="text-xs text-gray-600">
              {isLoadingSystemCost ? (
                'Loading system price...'
              ) : totalSystemPrice !== null ? (
                `Accurate system price for your items: ${formatPrice(totalSystemPrice)} WAL total`
              ) : (
                'System price unavailable'
              )}
            </p>
          </div>

          {/* Total Calculations */}
          <div className="space-y-3 backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4">
            <h3 className="font-bold text-lg">Price Summary</h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Storage:</span>
                <span>{totalUnits} MiB</span>
              </div>

              {totalUserPrice > 0 && (
                <>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total Asking Price:</span>
                    <span className="font-bold">
                      {formatPrice(totalUserPrice)} WAL
                    </span>
                  </div>
                  {priceDifferenceText && (
                    <div className={`text-xs text-right -mt-1 ${priceDifferenceText.color}`}>
                      {priceDifferenceText.text}
                    </div>
                  )}

                  {/* Competitiveness Score */}
                  {competitivenessScore && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                        <span className="font-semibold">Competitiveness:</span>
                        <span className={`font-bold ${competitivenessScore.color}`}>
                          {competitivenessScore.label}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            competitivenessScore.score >= 80
                              ? 'bg-green-500'
                              : competitivenessScore.score >= 50
                              ? 'bg-yellow-500'
                              : competitivenessScore.score >= 20
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${competitivenessScore.score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="border-t border-[#97f0e5]/20 pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Total System Price:</span>
                  <span className="font-mono">
                    {isLoadingSystemCost ? (
                      'Loading...'
                    ) : totalSystemPrice !== null ? (
                      `${formatPrice(totalSystemPrice)} WAL`
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Accurate network price calculated per item
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                const price = parseFloat(pricePerMiBPerEpoch);

                await listStorage({
                  items: selectedItems,
                  itemType,
                  pricePerMiBPerEpoch: price,
                });

                toast({
                  title: "Success!",
                  description: `Successfully listed ${selectedItems.length} ${itemType === 'storage' ? 'storage unit' : 'blob'}${selectedItems.length !== 1 ? 's' : ''} for sale`,
                });

                // Call onSuccess callback to refresh the storage list
                onSuccess?.();

                // Close the dialog
                onClose();
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to list storage';
                toast({
                  title: "Error",
                  description: errorMessage,
                  variant: "destructive",
                });
              }
            }}
            disabled={!pricePerMiBPerEpoch || parseFloat(pricePerMiBPerEpoch) <= 0 || isListing}
            className="w-full sm:w-auto rounded-xl border-2 border-[#97f0e5] bg-[#97f0e5]/50 font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/30 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isListing ? 'Listing...' : 'List for Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
