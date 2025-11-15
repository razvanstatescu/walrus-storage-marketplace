"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ListingItem {
  id: string;
  objectId: string;
  size: string;
  startEpoch: number;
  endEpoch: number;
  price: string; // Formatted price in WAL
  listedAt: Date;
}

interface MyListingsTableProps {
  items: ListingItem[];
  isLoading?: boolean;
  error?: string | null;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  currentEpoch?: number | null;
}

export function MyListingsTable({
  items,
  isLoading = false,
  error = null,
  selectedItems: externalSelectedItems,
  onSelectionChange,
  currentEpoch = null,
}: MyListingsTableProps) {
  const [internalSelectedItems, setInternalSelectedItems] = useState<string[]>([]);
  // Use external selection if provided, otherwise use internal state
  const selectedItems = externalSelectedItems !== undefined ? externalSelectedItems : internalSelectedItems;
  const setSelectedItems = onSelectionChange || setInternalSelectedItems;

  // Check if an item is expired
  const isExpired = (item: ListingItem) => {
    if (currentEpoch === null) return false;
    return item.endEpoch <= currentEpoch;
  };

  // Format object ID to show first 6 and last 4 characters
  const formatObjectId = (objectId: string) => {
    if (objectId.length <= 10) return objectId;
    return `${objectId.slice(0, 6)}...${objectId.slice(-4)}`;
  };

  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
    if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    }
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  };

  // Calculate duration in epochs
  const calculateDuration = (startEpoch: number, endEpoch: number) => {
    return endEpoch - startEpoch;
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
              <TableHead className="font-bold text-black">Duration</TableHead>
              <TableHead className="font-bold text-black">Price</TableHead>
              <TableHead className="font-bold text-black">Listed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-red-600">
                  Error: {error}
                </TableCell>
              </TableRow>
            ) : isLoading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                  Loading listings...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                  No listings found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const expired = isExpired(item);
                const duration = calculateDuration(item.startEpoch, item.endEpoch);

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
                        className={`cursor-pointer ${expired
                          ? "border-2 !border-red-500 data-[state=checked]:!bg-red-500 data-[state=checked]:!text-white data-[state=checked]:!border-red-500"
                          : "border-2 !border-[#97f0e5] data-[state=checked]:!bg-[#97f0e5] data-[state=checked]:!text-black data-[state=checked]:!border-[#97f0e5]"
                          }`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatObjectId(item.objectId)}
                    </TableCell>
                    <TableCell className="font-bold">{item.size}</TableCell>
                    <TableCell className={expired ? "font-bold text-red-600" : ""}>
                      {duration} epoch{duration !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="font-bold">
                      <span className="text-black">{item.price}</span>{" "}
                      <span className="text-secondary text-sm">WAL</span>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {formatRelativeTime(item.listedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
