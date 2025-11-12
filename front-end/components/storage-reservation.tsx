"use client";

import { useState } from "react";
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

type StorageUnit = "KB" | "MB" | "GB" | "TB";

const UNIT_MULTIPLIERS = {
  KB: 1,
  MB: 1024,
  GB: 1024 * 1024,
  TB: 1024 * 1024 * 1024,
};

// Mock pricing constants (adjust as needed)
const WAL_PER_GB_PER_EPOCH = 0.001; // 0.001 WAL per GB per epoch
const WAL_TO_USD = 0.5; // 1 WAL = $0.50
const SYSTEM_STORAGE_PREMIUM = 1.25; // System storage costs 25% more

export default function StorageReservation() {
  const [size, setSize] = useState<number>(100);
  const [unit, setUnit] = useState<StorageUnit>("GB");
  const [epochs, setEpochs] = useState<number[]>([30]); // Slider returns array

  // Calculate total size in GB
  const sizeInGB = (size * UNIT_MULTIPLIERS[unit]) / UNIT_MULTIPLIERS.GB;

  // Calculate costs
  const walCost = sizeInGB * epochs[0] * WAL_PER_GB_PER_EPOCH;
  const usdCost = walCost * WAL_TO_USD;
  const savingsPercentage = ((SYSTEM_STORAGE_PREMIUM - 1) * 100).toFixed(0);

  return (
    <div className="backdrop-blur-md bg-[#97f0e5]/10 border-2 border-[#97f0e5] rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]">
      <h3 className="text-xl font-black mb-6">RESERVE STORAGE</h3>

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
              <SelectItem value="KB">KB</SelectItem>
              <SelectItem value="MB">MB</SelectItem>
              <SelectItem value="GB">GB</SelectItem>
              <SelectItem value="TB">TB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Epoch Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm font-bold">RESERVATION EPOCHS</Label>
          <span className="text-sm font-bold text-[#97f0e5]">
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
          <div className="text-2xl font-black text-[#97f0e5]">
            {walCost.toFixed(4)} WAL
          </div>
          <div className="text-sm text-gray-600 mt-1">
            ≈ ${usdCost.toFixed(2)} USD
          </div>
        </div>

        <div className="bg-white/70 border-2 border-[#97f0e5] rounded-xl p-4">
          <div className="text-xs font-bold text-gray-600 mb-1">
            YOU SAVE
          </div>
          <div className="text-2xl font-black text-green-600">
            {savingsPercentage}%
          </div>
          <div className="text-sm text-gray-600 mt-1">vs System Storage</div>
        </div>
      </div>

      {/* Buy Button */}
      <Button
        variant="outline"
        className="w-full rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] h-12 cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        Reserve Storage
      </Button>

      {/* Info Text */}
      <p className="text-xs text-gray-600 text-center mt-3">
        Storage will be reserved for {epochs[0]} epoch{epochs[0] !== 1 ? "s" : ""}
        {" "}({sizeInGB.toFixed(2)} GB total)
      </p>
    </div>
  );
}
