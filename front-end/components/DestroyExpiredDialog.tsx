"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useStorageDestroy } from "@/hooks/useStorageDestroy";
import { toast } from "@/hooks/use-toast";
import {
  storageUnitsFromSize,
  calculateItemDuration,
} from "@/lib/utils/storagePrice";
import type { WalrusStorage } from "@/types/storage";

interface DestroyExpiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: WalrusStorage[];
  onSuccess?: () => void;
}

export function DestroyExpiredDialog({
  isOpen,
  onClose,
  selectedItems,
  onSuccess,
}: DestroyExpiredDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const { destroyStorage, isDestroying } = useStorageDestroy();

  // Reset confirmation when dialog closes
  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  // Convert items to storage data format
  const storageData = useMemo(() => {
    return selectedItems.map((item) => ({
      objectId: item.objectId,
      storageSize: item.storageSize,
      startEpoch: item.startEpoch,
      endEpoch: item.endEpoch,
    }));
  }, [selectedItems]);

  const handleDestroy = async () => {
    if (!confirmed) {
      toast({
        title: "Confirmation required",
        description: "Please confirm that you understand this action is permanent",
        variant: "destructive",
      });
      return;
    }

    try {
      await destroyStorage({
        items: selectedItems,
      });

      toast({
        title: "Success!",
        description: `Successfully destroyed ${selectedItems.length} expired storage object${selectedItems.length !== 1 ? 's' : ''}`,
      });

      // Call onSuccess callback to refresh the storage list
      onSuccess?.();

      // Close the dialog
      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to destroy storage';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-red-500 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-red-600">
            Destroy Expired Storage
          </DialogTitle>
          <DialogDescription>
            You have selected {selectedItems.length} expired storage object
            {selectedItems.length !== 1 ? 's' : ''} to destroy permanently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Message */}
          <div className="backdrop-blur-md bg-red-500/10 border-2 border-red-500 rounded-xl p-4">
            <p className="text-red-600 font-bold text-sm">
              ⚠️ WARNING: This action is permanent and cannot be undone!
            </p>
            <p className="text-red-600 text-sm mt-2">
              Destroying storage objects will permanently delete them from the blockchain.
            </p>
          </div>

          {/* Selected Items Summary */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Selected Expired Items</h3>
            <div className="max-h-48 overflow-y-auto space-y-2 backdrop-blur-md bg-red-500/5 border-2 border-red-500 rounded-xl p-4">
              {storageData.map((item) => {
                const units = storageUnitsFromSize(item.storageSize);
                const duration = calculateItemDuration(item.startEpoch, item.endEpoch);
                return (
                  <div
                    key={item.objectId}
                    className="flex justify-between items-center text-sm border-b border-red-500/20 pb-2 last:border-0"
                  >
                    <div>
                      <span className="font-mono">
                        {item.objectId.slice(0, 6)}...{item.objectId.slice(-4)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{units} MiB</div>
                      <div className="text-xs text-gray-600">
                        Expired (lasted {duration} epochs)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-3 backdrop-blur-md bg-red-500/5 border-2 border-red-500 rounded-xl p-4">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              className="border-2 border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:text-white data-[state=checked]:border-red-500 cursor-pointer mt-0.5"
            />
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="confirm"
                className="font-bold cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand this action is permanent
              </Label>
              <p className="text-xs text-gray-600">
                These storage objects will be permanently deleted and cannot be recovered
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDestroy}
            disabled={!confirmed || isDestroying}
            className="rounded-xl border-2 border-red-500 bg-red-500/50 font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] cursor-pointer hover:bg-red-500/30 hover:shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDestroying ? 'Destroying...' : 'Destroy Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
