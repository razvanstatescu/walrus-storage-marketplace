import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { WalletProviders } from '@/components/providers/WalletProviders'
import { Toaster } from '@/components/ui/toaster'
import '@mysten/dapp-kit/dist/index.css'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Storewave - Walrus Storage Marketplace',
  description: 'Decentralized storage marketplace on Sui powered by Walrus',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <WalletProviders>
          {children}
          <Toaster />
          <Analytics />
        </WalletProviders>
      </body>
    </html>
  )
}
