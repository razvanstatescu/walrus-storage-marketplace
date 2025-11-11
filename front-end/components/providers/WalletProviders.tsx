"use client"

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { networkConfig, network } from '@/lib/config/sui'

const queryClient = new QueryClient()

interface WalletProvidersProps {
  children: React.ReactNode
}

export function WalletProviders({ children }: WalletProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={network}>
        <WalletProvider autoConnect={true}>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
