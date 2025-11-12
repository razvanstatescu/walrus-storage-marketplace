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

interface WalletItem {
  id: string;
  objectId: string;
  size: string;
  startEpoch: number;
  endEpoch: number;
}

interface WalletTableProps {
  items: WalletItem[];
}

export function WalletTable({ items }: WalletTableProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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
                  className="border-2 border-[#97f0e5] data-[state=checked]:bg-[#97f0e5] data-[state=checked]:text-black"
                  ref={(el) => {
                    if (el && someSelected) {
                      el.dataset.state = "indeterminate";
                    }
                  }}
                />
              </TableHead>
              <TableHead className="font-bold text-black">Object ID</TableHead>
              <TableHead className="font-bold text-black">Size</TableHead>
              <TableHead className="font-bold text-black">Start Epoch</TableHead>
              <TableHead className="font-bold text-black">End Epoch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-600">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b border-[#97f0e5]/20 hover:bg-[#97f0e5]/5 transition-colors cursor-pointer"
                  onClick={() => toggleItem(item.id)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                      aria-label={`Select ${item.objectId}`}
                      className="border-2 border-[#97f0e5] data-[state=checked]:bg-[#97f0e5] data-[state=checked]:text-black"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatObjectId(item.objectId)}
                  </TableCell>
                  <TableCell className="font-bold">{item.size}</TableCell>
                  <TableCell>{item.startEpoch}</TableCell>
                  <TableCell>{item.endEpoch}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
