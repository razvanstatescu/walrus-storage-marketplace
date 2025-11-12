import StorageReservation from "@/components/storage-reservation";
import { MarketplaceAnalytics } from "@/components/MarketplaceAnalytics";
import { AppShell } from "@/components/layouts/AppShell";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function Dashboard() {
  return (
    <AppShell>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-black">Reserve Storage</h1>
            <p className="text-gray-600 mt-2">
              Reserve decentralized storage on the Walrus network
            </p>
          </div>

          <StorageReservation />

          <MarketplaceAnalytics />
        </div>

        {/* Original content kept for reference - can be removed later
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-black mb-4">
            CONNECTED ACCOUNTS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SocialMediaCard
              platform="Instagram"
              username="@yourbrand"
              icon={<Instagram className="h-6 w-6" />}
              color="bg-gradient-to-br from-purple-500 to-pink-500"
            />
            <SocialMediaCard
              platform="Twitter"
              username="@yourbrand"
              icon={<Twitter className="h-6 w-6" />}
              color="bg-blue-400"
            />
            <SocialMediaCard
              platform="LinkedIn"
              username="Your Brand"
              icon={<Linkedin className="h-6 w-6" />}
              color="bg-blue-600"
            />
            <Button className="h-full min-h-[120px] border-4 border-dashed border-[#97f0e5] rounded-xl flex flex-col items-center justify-center gap-2 bg-white/50 hover:bg-white/70">
              <Plus className="h-8 w-8" />
              <span className="font-bold">Add Platform</span>
            </Button>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-black mb-4">CREATE CONTENT</h2>
          <Tabs defaultValue="post" className="w-full">
            <TabsList className="w-full bg-white/50 border-2 border-[#97f0e5] rounded-xl p-1 mb-4">
              <TabsTrigger
                value="post"
                className="rounded-lg data-[state=active]:bg-[#97f0e5] data-[state=active]:text-black font-bold"
              >
                Post
              </TabsTrigger>
              <TabsTrigger
                value="story"
                className="rounded-lg data-[state=active]:bg-[#97f0e5] data-[state=active]:text-black font-bold"
              >
                Story
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="rounded-lg data-[state=active]:bg-[#97f0e5] data-[state=active]:text-black font-bold"
              >
                Video
              </TabsTrigger>
            </TabsList>
            <TabsContent value="post">
              <ContentCreator type="post" />
            </TabsContent>
            <TabsContent value="story">
              <ContentCreator type="story" />
            </TabsContent>
            <TabsContent value="video">
              <ContentCreator type="video" />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black mb-4">CONTENT STUDIO</h2>
          <StudioSelector />
        </div>
        */}
      </DashboardLayout>
    </AppShell>
  );
}
