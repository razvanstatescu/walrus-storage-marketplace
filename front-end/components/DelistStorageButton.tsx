"use client";

import { Button } from "@/components/ui/button";
import { useStorageDelisting } from "@/hooks/useStorageDelisting";
import { toast } from "@/hooks/use-toast";

interface DelistStorageButtonProps {
  selectedStorageIds: string[];
  onSuccess?: () => void;
  disabled?: boolean;
}

export function DelistStorageButton({
  selectedStorageIds,
  onSuccess,
  disabled,
}: DelistStorageButtonProps) {
  const { delistStorage, isDelisting } = useStorageDelisting();

  const handleDelist = async () => {
    try {
      await delistStorage({
        storageIds: selectedStorageIds,
        onSuccess: () => {
          toast({
            title: "Success!",
            description: `Successfully delisted ${selectedStorageIds.length} storage item${selectedStorageIds.length !== 1 ? "s" : ""}`,
          });
          onSuccess?.();
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delist storage";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const isDisabled = disabled || isDelisting || selectedStorageIds.length === 0;

  return (
    <Button
      onClick={handleDelist}
      disabled={isDisabled}
      className="rounded-xl border-2 border-[#97f0e5] bg-[#97f0e5]/50 font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/30 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-black disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDelisting
        ? "Delisting..."
        : selectedStorageIds.length === 0
        ? "Remove Listings"
        : `Remove ${selectedStorageIds.length} Listing${selectedStorageIds.length !== 1 ? "s" : ""}`}
    </Button>
  );
}
