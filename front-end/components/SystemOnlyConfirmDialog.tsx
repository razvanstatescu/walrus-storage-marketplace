"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SystemOnlyConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmMixed: () => void;
  onConfirmSystemOnly: () => void;
  mixedCost: string;
  systemOnlyCost: string;
  errorMessage: string;
}

export function SystemOnlyConfirmDialog({
  isOpen,
  onClose,
  onConfirmMixed,
  onConfirmSystemOnly,
  mixedCost,
  systemOnlyCost,
  errorMessage,
}: SystemOnlyConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transaction May Fail</DialogTitle>
          <DialogDescription>
            The optimized transaction includes marketplace purchases that may fail.
            Would you like to use system storage instead?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4">
            <p className="text-sm text-red-700 font-semibold mb-1">Dry Run Error:</p>
            <p className="text-xs text-red-600 font-mono">{errorMessage}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-[#97f0e5] rounded-xl p-4">
              <p className="text-xs font-bold text-gray-600 mb-1">OPTIMIZED PRICE</p>
              <p className="text-xl font-black text-gray-900">{mixedCost}</p>
              <p className="text-xs text-orange-600 mt-1">⚠ May fail</p>
            </div>

            <div className="border-2 border-green-500 rounded-xl p-4 bg-green-50">
              <p className="text-xs font-bold text-gray-600 mb-1">SYSTEM ONLY</p>
              <p className="text-xl font-black text-gray-900">{systemOnlyCost}</p>
              <p className="text-xs text-green-600 mt-1">✓ Guaranteed</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Recommendation:</strong> System storage is slightly more expensive
              but guaranteed to succeed. The mixed transaction may fail if marketplace
              listings have changed.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onConfirmMixed} className="flex-1">
            Try Mixed Anyway
          </Button>
          <Button onClick={onConfirmSystemOnly} className="flex-1 bg-green-600 hover:bg-green-700">
            Use System Storage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
