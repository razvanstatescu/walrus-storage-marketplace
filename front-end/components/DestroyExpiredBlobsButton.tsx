"use client";

import { Button } from "@/components/ui/button";

interface DestroyExpiredBlobsButtonProps {
  count: number;
  onClick: () => void;
}

/**
 * Fixed button that appears when expired blob items are selected
 * Positioned above the List Storage button on the bottom right
 */
export function DestroyExpiredBlobsButton({ count, onClick }: DestroyExpiredBlobsButtonProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-[5.5rem] right-4 z-50 md:bottom-[6.5rem] md:right-6">
      <Button
        onClick={onClick}
        variant="outline"
        className="rounded-xl border-2 border-red-500 font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] cursor-pointer hover:bg-red-500/10 hover:text-red-600 hover:shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-6 py-6 text-red-600"
      >
        Destroy Expired ({count})
      </Button>
    </div>
  );
}
