import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Instagram, Plus, Twitter, Linkedin } from "lucide-react"
import SocialMediaCard from "@/components/social-media-card"
import ContentCreator from "@/components/content-creator"
import StudioSelector from "@/components/studio-selector"
import { AppShell } from "@/components/layout/AppShell"
import { MainNavbar } from "@/components/layout/MainNavbar"
import { Sidebar } from "@/components/layout/Sidebar"

export default function Dashboard() {
  return (
    <AppShell>
      <MainNavbar
        title="POSTCRAFT"
        actions={
          <>
            <Button className="bg-black hover:bg-black/80 text-white rounded-xl border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Connect Account
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Settings
            </Button>
          </>
        }
      />

      <div className="grid md:grid-cols-[280px_1fr] h-[calc(100vh-6rem)]">
        <Sidebar activeLink="Dashboard" />

        {/* Main content */}
        <div className="overflow-auto p-4 sm:p-6">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-black mb-4">CONNECTED ACCOUNTS</h2>
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
              <Button className="h-full min-h-[120px] border-4 border-dashed border-black rounded-xl flex flex-col items-center justify-center gap-2 bg-white/50 hover:bg-white/70">
                <Plus className="h-8 w-8" />
                <span className="font-bold">Add Platform</span>
              </Button>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-xl sm:text-2xl font-black mb-4">CREATE CONTENT</h2>
            <Tabs defaultValue="post" className="w-full">
              <TabsList className="w-full bg-white/50 border-2 border-black rounded-xl p-1 mb-4">
                <TabsTrigger
                  value="post"
                  className="rounded-lg data-[state=active]:bg-black data-[state=active]:text-white font-bold"
                >
                  Post
                </TabsTrigger>
                <TabsTrigger
                  value="story"
                  className="rounded-lg data-[state=active]:bg-black data-[state=active]:text-white font-bold"
                >
                  Story
                </TabsTrigger>
                <TabsTrigger
                  value="video"
                  className="rounded-lg data-[state=active]:bg-black data-[state=active]:text-white font-bold"
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
        </div>
      </div>
    </AppShell>
  )
}
