"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WalletItem {
  id: string;
  objectId: string;
  size: string;
  startEpoch: number;
  endEpoch: number;
}

interface WalletTableProps {
  items: WalletItem[];
  isLoading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  currentEpoch?: number | null;
  itemType?: "storage" | "blobs";
}

export function WalletTable({
  items,
  isLoading = false,
  error = null,
  hasMore = false,
  onLoadMore,
  selectedItems: externalSelectedItems,
  onSelectionChange,
  currentEpoch = null,
  itemType = "storage",
}: WalletTableProps) {
  const [internalSelectedItems, setInternalSelectedItems] = useState<string[]>([]);

  // Use external selection if provided, otherwise use internal state
  const selectedItems = externalSelectedItems !== undefined ? externalSelectedItems : internalSelectedItems;
  const setSelectedItems = onSelectionChange || setInternalSelectedItems;

  // Check if an item is expired
  const isExpired = (item: WalletItem) => {
    if (currentEpoch === null) return false;
    return item.endEpoch <= currentEpoch;
  };

  // Format object ID to show first 6 and last 4 characters
  const formatObjectId = (objectId: string) => {
    if (objectId.length <= 10) return objectId;
    return `${objectId.slice(0, 6)}...${objectId.slice(-4)}`;
  };

  // Toggle individual item selection
  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle all items selection
  const toggleAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && !allSelected;

  return (
    <div className="backdrop-blur-md bg-[#97f0e5]/5 border-2 border-[#97f0e5] rounded-xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#97f0e5] hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                  className="border-2 !border-[#97f0e5] data-[state=checked]:!bg-[#97f0e5] data-[state=checked]:!text-black data-[state=indeterminate]:!bg-[#97f0e5] data-[state=indeterminate]:!border-[#97f0e5] cursor-pointer"
                  ref={(el) => {
                    if (el && someSelected) {
                      el.dataset.state = "indeterminate";
                    }
                  }}
                />
              </TableHead>
              <TableHead className="font-bold text-black">Object ID</TableHead>
              <TableHead className="font-bold text-black">Storage Size</TableHead>
              <TableHead className="font-bold text-black">Start Epoch</TableHead>
              <TableHead className="font-bold text-black">End Epoch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-red-600">
                  Error: {error}
                </TableCell>
              </TableRow>
            ) : isLoading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-600">
                  Loading storage objects...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-600">
                  No storage objects found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const expired = isExpired(item);

                return (
                  <TableRow
                    key={item.id}
                    className={`border-b border-[#97f0e5]/20 transition-colors hover:bg-[#97f0e5]/5 cursor-pointer`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                        aria-label={`Select ${item.objectId}`}
                        className={`cursor-pointer ${
                          expired
                            ? "border-2 !border-red-500 data-[state=checked]:!bg-red-500 data-[state=checked]:!text-white data-[state=checked]:!border-red-500"
                            : "border-2 !border-[#97f0e5] data-[state=checked]:!bg-[#97f0e5] data-[state=checked]:!text-black data-[state=checked]:!border-[#97f0e5]"
                        }`}
                      />
                    </TableCell>
                    <TableCell
                      className="font-mono text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/object/${item.objectId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-secondary hover:underline cursor-pointer transition-colors"
                      >
                        {formatObjectId(item.objectId)}
                      </a>
                    </TableCell>
                    <TableCell className="font-bold">{item.size}</TableCell>
                    <TableCell>{item.startEpoch}</TableCell>
                    <TableCell className={expired ? "font-bold text-red-600" : ""}>
                      {item.endEpoch}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load More Button */}
      {hasMore && !error && (
        <div className="mt-4 text-center">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            variant="outline"
            className="rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
