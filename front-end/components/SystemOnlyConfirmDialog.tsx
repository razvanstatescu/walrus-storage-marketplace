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
      <DialogContent className="sm:max-w-[600px]">
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
            <p className="text-xs text-red-600 font-mono break-words whitespace-pre-wrap">{errorMessage}</p>
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

          <div className="bg-[#97f0e5]/20 border-2 border-[#97f0e5] rounded-xl p-3">
            <p className="text-xs text-gray-800">
              <strong>Recommendation:</strong> System storage is slightly more expensive
              but guaranteed to succeed. The mixed transaction may fail if marketplace
              listings have changed.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onConfirmMixed}
            className="flex-1 rounded-xl border-2 border-gray-400 font-bold shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] h-12 cursor-pointer hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Try Mixed Anyway
          </Button>
          <Button
            variant="outline"
            onClick={onConfirmSystemOnly}
            className="flex-1 rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] h-12 cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Use System Storage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
