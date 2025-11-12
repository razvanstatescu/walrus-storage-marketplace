"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Lock } from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { ConnectButton } from "@mysten/dapp-kit";
import { useWalrusEpoch } from "@/hooks/useWalrusEpoch";
import { useStorageOptimizer } from "@/hooks/useStorageOptimizer";
import { formatWalPrice } from "@/lib/utils/storagePrice";

type StorageUnit = "KiB" | "MiB" | "GiB" | "TiB";

const UNIT_MULTIPLIERS = {
  KiB: 1024,
  MiB: 1024 * 1024,
  GiB: 1024 * 1024 * 1024,
  TiB: 1024 * 1024 * 1024 * 1024,
};

export default function StorageReservation() {
  const [size, setSize] = useState<number>(1);
  const [unit, setUnit] = useState<StorageUnit>("MiB");
  const [epochs, setEpochs] = useState<number[]>([5]); // Slider returns array

  const { isConnected } = useWalletConnection();
  const { epoch: currentEpoch, isLoading: isLoadingEpoch } = useWalrusEpoch();
  const { optimize, result: optimizationResult, isLoading: isOptimizing } = useStorageOptimizer();

  // Calculate total size in bytes
  const sizeInBytes = useMemo(() => {
    return BigInt(Math.floor(size * UNIT_MULTIPLIERS[unit]));
  }, [size, unit]);

  // Optimize storage allocation when inputs change
  useEffect(() => {
    if (currentEpoch === null || size <= 0) return;

    const timeoutId = setTimeout(() => {
      optimize({
        size: sizeInBytes.toString(),
        startEpoch: currentEpoch,
        endEpoch: currentEpoch + epochs[0],
      }).catch((error) => {
        console.error("Optimization failed:", error);
      });
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [sizeInBytes, currentEpoch, epochs, optimize]);

  // Calculate costs from optimization result
  const totalCostWal = useMemo(() => {
    if (!optimizationResult?.totalCost) return null;
    return formatWalPrice(optimizationResult.totalCost, 4);
  }, [optimizationResult]);

  const systemOnlyPriceWal = useMemo(() => {
    if (!optimizationResult?.systemOnlyPrice) return null;
    return formatWalPrice(optimizationResult.systemOnlyPrice, 4);
  }, [optimizationResult]);

  const savingsWal = useMemo(() => {
    if (!optimizationResult?.systemOnlyPrice || !optimizationResult?.totalCost) return null;
    const savings = BigInt(optimizationResult.systemOnlyPrice) - BigInt(optimizationResult.totalCost);
    return formatWalPrice(savings.toString(), 4);
  }, [optimizationResult]);

  const savingsPercentage = useMemo(() => {
    if (!optimizationResult?.systemOnlyPrice || !optimizationResult?.totalCost) return null;
    const systemPrice = Number(optimizationResult.systemOnlyPrice);
    const totalPrice = Number(optimizationResult.totalCost);
    if (systemPrice === 0) return "0";
    const percentage = ((systemPrice - totalPrice) / systemPrice) * 100;
    return percentage.toFixed(1);
  }, [optimizationResult]);


  const handleReserveClick = () => {
    // Handle reservation logic when connected
    console.log("Reserving storage...", {
      size: sizeInBytes.toString(),
      epochs: epochs[0],
      optimizationResult,
    });
  };

  return (
    <div className="backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]">
      {/* Storage Size Input */}
      <div className="mb-6">
        <Label className="text-sm font-bold mb-2 block">STORAGE SIZE</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="flex-1 border-2 border-[#97f0e5] rounded-xl font-bold"
            placeholder="Enter size"
          />
          <Select value={unit} onValueChange={(v) => setUnit(v as StorageUnit)}>
            <SelectTrigger className="w-[100px] border-2 border-[#97f0e5] rounded-xl font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KiB">KiB</SelectItem>
              <SelectItem value="MiB">MiB</SelectItem>
              <SelectItem value="GiB">GiB</SelectItem>
              <SelectItem value="TiB">TiB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Epoch Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm font-bold">RESERVATION EPOCHS</Label>
          <span className="text-sm font-bold text-secondary">
            {epochs[0]} epochs
          </span>
        </div>
        <Slider
          value={epochs}
          onValueChange={setEpochs}
          min={1}
          max={365}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>1 epoch</span>
          <span>365 epochs</span>
        </div>
      </div>

      {/* Cost Estimation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white/70 border-2 border-[#97f0e5] rounded-xl p-4">
          <div className="text-xs font-bold text-gray-600 mb-1">
            TOTAL COST
          </div>
          {isLoadingEpoch || isOptimizing ? (
            <div className="text-2xl font-black text-gray-400">
              Loading...
            </div>
          ) : totalCostWal ? (
            <div className="text-2xl font-black">
              <span className="text-black">{totalCostWal}</span>{" "}
              <span className="text-secondary">WAL</span>
            </div>
          ) : (
            <div className="text-2xl font-black text-gray-400">
              --
            </div>
          )}
        </div>

        <div className="bg-white/70 border-2 border-[#97f0e5] rounded-xl p-4">
          <div className="text-xs font-bold text-gray-600 mb-1">
            YOU SAVE
          </div>
          {isLoadingEpoch || isOptimizing ? (
            <div className="text-2xl font-black text-gray-400">
              Loading...
            </div>
          ) : savingsPercentage && savingsWal ? (
            <>
              <div className="text-2xl font-black text-green-600">
                {savingsPercentage}%
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {savingsWal} WAL vs System
              </div>
            </>
          ) : (
            <div className="text-2xl font-black text-gray-400">
              --
            </div>
          )}
        </div>
      </div>

      {/* Buy Button */}
      {!isConnected ? (
        <ConnectButton
          connectText={
            <span className="flex items-center font-bold">
              <Lock className="mr-2 h-4 w-4 text-secondary" />
              Connect to reserve space
            </span>
          }
          className="!w-full !rounded-xl !border-2 !border-[#97f0e5] !font-bold !shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] !h-12 !cursor-pointer hover:!bg-[#97f0e5]/10 hover:!shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:!translate-x-[2px] hover:!translate-y-[2px] !transition-all !bg-white !text-black !text-base !px-4 !py-2 [&>*]:!font-bold"
        />
      ) : (
        <Button
          variant="outline"
          onClick={handleReserveClick}
          className="w-full rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] h-12 cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Reserve Storage
        </Button>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-600 text-center mt-3">
        Storage will be reserved for {epochs[0]} epoch{epochs[0] !== 1 ? "s" : ""}
        {" "}({size} {unit} total)
      </p>
    </div>
  );
}
