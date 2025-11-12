"use client";

import { AppShell } from "@/components/layouts/AppShell";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletTable } from "@/components/wallet-table";

// Mock data for demonstration
const mockStorageData = [
  {
    id: "1",
    objectId: "0x1234567890abcdef1234567890abcdef12345678",
    size: "100 GB",
    startEpoch: 1000,
    endEpoch: 1030,
  },
  {
    id: "2",
    objectId: "0xabcdef1234567890abcdef1234567890abcdef12",
    size: "250 GB",
    startEpoch: 1005,
    endEpoch: 1035,
  },
  {
    id: "3",
    objectId: "0x567890abcdef1234567890abcdef1234567890ab",
    size: "50 GB",
    startEpoch: 1010,
    endEpoch: 1040,
  },
];

const mockBlobsData = [
  {
    id: "1",
    objectId: "0x9876543210fedcba9876543210fedcba98765432",
    size: "5.2 MB",
    startEpoch: 1008,
    endEpoch: 1038,
  },
  {
    id: "2",
    objectId: "0xfedcba9876543210fedcba9876543210fedcba98",
    size: "12.8 MB",
    startEpoch: 1012,
    endEpoch: 1042,
  },
];

export default function WalletPage() {
  return (
    <AppShell>
      <DashboardLayout title="MY WALLET">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black">MY WALLET</h2>

          <Tabs defaultValue="storage" className="w-full">
            <TabsList className="w-full sm:w-auto bg-white/50 border-2 border-[#97f0e5] rounded-xl p-1 mb-6">
              <TabsTrigger
                value="storage"
                className="rounded-lg data-[state=active]:bg-[#97f0e5] data-[state=active]:text-black font-bold"
              >
                My Storage
              </TabsTrigger>
              <TabsTrigger
                value="blobs"
                className="rounded-lg data-[state=active]:bg-[#97f0e5] data-[state=active]:text-black font-bold"
              >
                My Blobs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="storage">
              <WalletTable items={mockStorageData} />
            </TabsContent>

            <TabsContent value="blobs">
              <WalletTable items={mockBlobsData} />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AppShell>
  );
}
