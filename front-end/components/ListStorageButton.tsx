"use client";

import { Button } from "@/components/ui/button";

interface ListStorageButtonProps {
  count: number;
  onClick: () => void;
}

/**
 * Fixed button that appears when storage/blob items are selected
 * Positioned in the bottom right corner of the screen
 */
export function ListStorageButton({ count, onClick }: ListStorageButtonProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
      <Button
        onClick={onClick}
        variant="outline"
        className="rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-6 py-6"
      >
        List Storage ({count})
      </Button>
    </div>
  );
}
