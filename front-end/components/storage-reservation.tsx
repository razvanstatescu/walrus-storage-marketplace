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
import { Lock, Loader2 } from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { ConnectButton, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useWalrusEpoch } from "@/hooks/useWalrusEpoch";
import { useStorageOptimizer } from "@/hooks/useStorageOptimizer";
import { useWalBalance } from "@/hooks/useWalBalance";
import { formatWalPrice } from "@/lib/utils/storagePrice";
import { useNetworkVariable } from "@/lib/config/sui";
import { useToast } from "@/hooks/use-toast";
import OperationsGraph from "@/components/operations-graph";
import { SystemOnlyConfirmDialog } from "@/components/SystemOnlyConfirmDialog";
import { MixedOperationFailureError, buildSystemOnlyPTB } from "@/lib/utils/ptb-builder";

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
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSystemOnlyDialog, setShowSystemOnlyDialog] = useState(false);
  const [dryRunError, setDryRunError] = useState<string>("");
  const [pendingWalCoinIds, setPendingWalCoinIds] = useState<string[]>([]);

  const { isConnected } = useWalletConnection();
  const { epoch: currentEpoch, isLoading: isLoadingEpoch } = useWalrusEpoch();
  const { optimize, executePurchase, result: optimizationResult, isLoading: isOptimizing } = useStorageOptimizer();
  const { balance, isLoading: isLoadingBalance } = useWalBalance();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { toast } = useToast();

  // Contract configuration
  const packageId = useNetworkVariable("packageId");
  const marketplaceConfigId = useNetworkVariable("marketplaceConfigId");
  const walrusPackageId = useNetworkVariable("walrusPackageId");
  const walrusSystemObjectId = useNetworkVariable("walrusSystemObjectId");
  const walTokenType = useNetworkVariable("walTokenType");

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

  // Check if user has insufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!optimizationResult?.totalCost || balance === null) return false;
    // Convert totalCost from FROST to WAL for comparison
    // 1 WAL = 1,000,000,000 FROST
    const costInWal = Number(optimizationResult.totalCost) / 1_000_000_000;
    return balance < costInWal;
  }, [balance, optimizationResult]);

  const handleReserveClick = async () => {
    if (!currentAccount) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to reserve storage",
        variant: "destructive",
      });
      return;
    }

    if (!optimizationResult) {
      toast({
        title: "Optimization not ready",
        description: "Please wait for the cost calculation to complete",
        variant: "destructive",
      });
      return;
    }

    if (!packageId || !marketplaceConfigId || !walrusPackageId || !walrusSystemObjectId) {
      toast({
        title: "Configuration error",
        description: "Contract addresses are not properly configured",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    let walCoinIds: string[] = [];

    try {
      console.log("Reserving storage...", {
        size: sizeInBytes.toString(),
        epochs: epochs[0],
        optimizationResult,
      });

      // Fetch WAL coins from user's wallet
      const { data: coins } = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: walTokenType,
      });

      if (!coins || coins.length === 0) {
        toast({
          title: "Insufficient balance",
          description: "You don't have any WAL coins to pay for storage",
          variant: "destructive",
        });
        return;
      }

      // Get coin IDs
      walCoinIds = coins.map((coin) => coin.coinObjectId);

      // Build contract config
      const contractConfig = {
        marketplacePackageId: packageId,
        marketplaceObjectId: marketplaceConfigId,
        walrusSystemObjectId,
        walrusPackageId,
      };

      // Execute purchase
      const result = await executePurchase(
        optimizationResult,
        walCoinIds,
        contractConfig
      );

      toast({
        title: "Storage reserved successfully!",
        description: `Transaction: ${result.digest}`,
      });

      console.log("Transaction result:", result);
    } catch (error) {
      // Check if this is a mixed operation dry run failure
      if (error instanceof MixedOperationFailureError) {
        setDryRunError(error.dryRunError || error.message);
        setPendingWalCoinIds(walCoinIds);
        setShowSystemOnlyDialog(true);
        return;
      }

      // For other errors, log and show toast
      console.error("Storage reservation failed:", error);
      toast({
        title: "Reservation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleMixedOperationConfirm = async () => {
    setShowSystemOnlyDialog(false);
    // User wants to try the mixed operation anyway
    // We'll need to bypass the dry run check somehow
    toast({
      title: "Proceeding with mixed operation",
      description: "Note: This transaction may still fail during execution",
      variant: "default",
    });
  };

  const handleSystemOnlyConfirm = async () => {
    setShowSystemOnlyDialog(false);

    if (!currentAccount || !optimizationResult || !packageId || !walrusPackageId || !walrusSystemObjectId || !marketplaceConfigId) {
      toast({
        title: "Configuration error",
        description: "Missing required configuration",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);

    try {
      // Build contract config
      const contractConfig = {
        marketplacePackageId: packageId,
        marketplaceObjectId: marketplaceConfigId,
        walrusSystemObjectId,
        walrusPackageId,
      };

      // Calculate start and end epochs
      const startEpoch = currentEpoch + 1;
      const endEpoch = startEpoch + epochs[0] - 1;

      // Create a system-only optimization result
      const systemOnlyResult = {
        operations: [{
          type: 'reserve_space',
          description: 'Reserve from system storage',
          reserveSize: sizeInBytes.toString(),
          startEpoch,
          endEpoch,
          cost: optimizationResult.systemOnlyPrice,
        }],
        totalCost: optimizationResult.systemOnlyPrice,
        systemOnlyPrice: optimizationResult.systemOnlyPrice,
        allocations: [],
        ptbMetadata: {
          paymentAmounts: [optimizationResult.systemOnlyPrice],
          executionFlow: [{
            operationIndex: 0,
            type: 'reserve_space',
            producesStorage: true,
            storageRef: 'storage_0',
            paymentIndex: 0,
          }],
        },
      };

      // Execute purchase with system-only result
      const result = await executePurchase(
        systemOnlyResult,
        pendingWalCoinIds,
        contractConfig,
      );

      toast({
        title: "Storage reserved successfully!",
        description: `Transaction: ${result.digest}`,
      });

      console.log("System-only transaction result:", result);
    } catch (error) {
      console.error("System-only reservation failed:", error);
      toast({
        title: "Reservation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
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

      {/* Operations Graph Visualization */}
      <OperationsGraph optimizationResult={optimizationResult} />

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
          disabled={isExecuting || isOptimizing || !optimizationResult || isLoadingBalance || hasInsufficientBalance}
          className="w-full rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] h-12 cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        >
          {isExecuting ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing Transaction...
            </span>
          ) : isOptimizing ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizing...
            </span>
          ) : hasInsufficientBalance ? (
            "Insufficient Balance"
          ) : (
            "Reserve Storage"
          )}
        </Button>
      )}

      {/* Insufficient Balance Warning */}
      {hasInsufficientBalance && totalCostWal && balance !== null && (
        <p className="text-xs text-red-500 text-center mt-2 font-semibold">
          Insufficient WAL balance. Need {totalCostWal} WAL but only have {balance.toFixed(1)} WAL
        </p>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-600 text-center mt-3">
        Storage will be reserved for {epochs[0]} epoch{epochs[0] !== 1 ? "s" : ""}
        {" "}({size} {unit} total)
      </p>

      {/* System-Only Confirmation Dialog */}
      <SystemOnlyConfirmDialog
        isOpen={showSystemOnlyDialog}
        onClose={() => setShowSystemOnlyDialog(false)}
        onConfirmMixed={handleMixedOperationConfirm}
        onConfirmSystemOnly={handleSystemOnlyConfirm}
        mixedCost={optimizationResult ? formatWalPrice(optimizationResult.totalCost, 4) : "0 WAL"}
        systemOnlyCost={optimizationResult ? formatWalPrice(optimizationResult.systemOnlyPrice, 4) : "0 WAL"}
        errorMessage={dryRunError}
      />
    </div>
  );
}
