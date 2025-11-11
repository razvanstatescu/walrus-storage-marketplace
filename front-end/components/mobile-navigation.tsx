import { Button } from "@/components/ui/button"
import { NavigationLinks } from "@/components/layout/NavigationLinks"
import { PlatformButtons } from "@/components/layout/PlatformButtons"

export default function MobileNavigation() {
  return (
    <div className="h-full bg-white/40 backdrop-blur-md flex flex-col">
      <div className="p-6 border-b-4 border-black">
        <h2 className="text-2xl font-black">POSTCRAFT</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mb-8">
          <NavigationLinks activeLink="Dashboard" />
        </div>
        <PlatformButtons />
      </div>

      <div className="p-4 border-t-4 border-black">
        <div className="grid grid-cols-2 gap-2">
          <Button className="bg-black hover:bg-black/80 text-white rounded-xl border-2 border-black font-bold">
            Connect
          </Button>
          <Button variant="outline" className="rounded-xl border-2 border-black font-bold">
            Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
