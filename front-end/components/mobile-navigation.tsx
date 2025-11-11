import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Instagram, Linkedin, Twitter, Youtube } from "lucide-react"

export default function MobileNavigation() {
  return (
    <div className="h-full bg-white/40 backdrop-blur-md flex flex-col">
      <div className="p-6 border-b-4 border-[#97f0e5]">
        <h2 className="text-2xl font-black">POSTCRAFT</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <nav className="space-y-2 mb-8">
          <Link href="#" className="flex items-center gap-2 text-lg font-bold p-3 bg-[#97f0e5] text-black rounded-xl">
            Dashboard
          </Link>
          <Link href="#" className="flex items-center gap-2 text-lg font-bold p-3 hover:bg-[#97f0e5]/10 rounded-xl">
            Analytics
          </Link>
          <Link href="#" className="flex items-center gap-2 text-lg font-bold p-3 hover:bg-[#97f0e5]/10 rounded-xl">
            Calendar
          </Link>
          <Link href="#" className="flex items-center gap-2 text-lg font-bold p-3 hover:bg-[#97f0e5]/10 rounded-xl">
            Messages
          </Link>
        </nav>

        <div>
          <h2 className="text-xl font-black mb-4">PLATFORMS</h2>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2 rounded-xl border-2 border-[#97f0e5] font-bold">
              <Instagram className="h-5 w-5" /> Instagram
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 rounded-xl border-2 border-[#97f0e5] font-bold">
              <Twitter className="h-5 w-5" /> Twitter
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 rounded-xl border-2 border-[#97f0e5] font-bold">
              <Linkedin className="h-5 w-5" /> LinkedIn
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 rounded-xl border-2 border-[#97f0e5] font-bold">
              <Youtube className="h-5 w-5" /> YouTube
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t-4 border-[#97f0e5]">
        <div className="grid grid-cols-2 gap-2">
          <Button className="bg-[#97f0e5] hover:bg-[#97f0e5]/80 text-black rounded-xl border-2 border-[#97f0e5] font-bold">
            Connect
          </Button>
          <Button variant="outline" className="rounded-xl border-2 border-[#97f0e5] font-bold">
            Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
