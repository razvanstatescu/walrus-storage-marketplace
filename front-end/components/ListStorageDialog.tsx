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
  const { calculateCost, result: systemCostResult, isLoading: isLoadingSystemCost } = useWalrusStorageCost();
  const { listStorage, isListing } = useStorageListing();

  // Calculate system price on mount
  useEffect(() => {
    if (isOpen) {
      calculateCost({
        size: 1024 * 1024, // 1 MiB
        epochs: 1,         // 1 epoch
      });
    }
  }, [isOpen, calculateCost]);

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

  // Calculate totals
  const totalUnits = useMemo(() => {
    return calculateTotalUnits(storageData);
  }, [storageData]);

  const totalUserPrice = useMemo(() => {
    const price = parseFloat(pricePerMiBPerEpoch);
    if (isNaN(price) || price <= 0) return 0;
    return calculateTotalPrice(storageData, price);
  }, [storageData, pricePerMiBPerEpoch]);

  const systemPricePerMiB = useMemo(() => {
    if (!systemCostResult) return null;
    return systemCostResult.storageCost;
  }, [systemCostResult]);

  // Calculate total system price for all selected items
  const totalSystemPrice = useMemo(() => {
    if (!systemPricePerMiB) return null;
    const pricePerMiBPerEpochNumber = Number(systemPricePerMiB) / 1_000_000_000; // Convert FROST to WAL
    return calculateTotalPrice(storageData, pricePerMiBPerEpochNumber);
  }, [systemPricePerMiB, storageData]);

  // Calculate percentage difference from system price
  const priceDifferencePercent = useMemo(() => {
    if (!totalSystemPrice || !totalUserPrice || totalUserPrice === 0) return null;
    const difference = ((totalUserPrice - totalSystemPrice) / totalSystemPrice) * 100;
    return difference;
  }, [totalSystemPrice, totalUserPrice]);

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

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="price" className="font-bold">
              Your price per storage unit (MiB)
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
              ) : systemPricePerMiB ? (
                `System price currently ${formatWalPrice(systemPricePerMiB)} WAL per storage unit`
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
                  {priceDifferencePercent !== null && (
                    <div className="text-xs text-gray-600 text-right -mt-1">
                      {priceDifferencePercent > 0 ? (
                        <span className="text-orange-600">
                          {priceDifferencePercent.toFixed(1)}% above system price
                        </span>
                      ) : priceDifferencePercent < 0 ? (
                        <span className="text-green-600">
                          {Math.abs(priceDifferencePercent).toFixed(1)}% below system price
                        </span>
                      ) : (
                        <span>
                          Matches system price
                        </span>
                      )}
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
                  Total network price for selected items
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
            className="rounded-xl border-2 border-[#97f0e5] bg-[#97f0e5]/50 font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/30 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isListing ? 'Listing...' : 'List for Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
