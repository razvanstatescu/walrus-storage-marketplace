import { getFullnodeUrl } from '@mysten/sui/client'
import { createNetworkConfig } from '@mysten/dapp-kit'

const network = (process.env.NEXT_PUBLIC_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet') || 'testnet'

// Create network configuration
const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  localnet: {
    url: getFullnodeUrl('localnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      marketplaceConfigId: process.env.NEXT_PUBLIC_MARKETPLACE_CONFIG_ID || '',
    }
  },
  devnet: {
    url: getFullnodeUrl('devnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      marketplaceConfigId: process.env.NEXT_PUBLIC_MARKETPLACE_CONFIG_ID || '',
    }
  },
  testnet: {
    url: getFullnodeUrl('testnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      marketplaceConfigId: process.env.NEXT_PUBLIC_MARKETPLACE_CONFIG_ID || '',
    }
  },
  mainnet: {
    url: getFullnodeUrl('mainnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      marketplaceConfigId: process.env.NEXT_PUBLIC_MARKETPLACE_CONFIG_ID || '',
    }
  },
})

export {
  networkConfig,
  useNetworkVariable,
  useNetworkVariables,
  network
}
