"use client"

import { Button } from "@/components/ui/button"
import { Instagram, Linkedin, Twitter, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"

export const platforms = [
  { name: "Instagram", icon: Instagram },
  { name: "Twitter", icon: Twitter },
  { name: "LinkedIn", icon: Linkedin },
  { name: "YouTube", icon: Youtube },
]

interface PlatformButtonsProps {
  className?: string
}

export function PlatformButtons({ className }: PlatformButtonsProps) {
  return (
    <div className={className}>
      <h2 className="text-xl font-black mb-4">PLATFORMS</h2>
      <div className="space-y-2">
        {platforms.map((platform) => {
          const Icon = platform.icon
          return (
            <Button
              key={platform.name}
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl border-2 border-black font-bold"
            >
              <Icon className="h-5 w-5" /> {platform.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
