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
      storageObjectType: process.env.NEXT_PUBLIC_STORAGE_OBJECT_TYPE || 'walrus::storage_resource::Storage',
      blobObjectType: process.env.NEXT_PUBLIC_BLOB_OBJECT_TYPE || 'walrus::blob::Blob',
      walrusPackageId: process.env.NEXT_PUBLIC_WALRUS_PACKAGE_ID || '',
      walrusSystemObjectId: process.env.NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT_ID || '',
    }
  },
  devnet: {
    url: getFullnodeUrl('devnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      marketplaceConfigId: process.env.NEXT_PUBLIC_MARKETPLACE_CONFIG_ID || '',
      storageObjectType: process.env.NEXT_PUBLIC_STORAGE_OBJECT_TYPE || 'walrus::storage_resource::Storage',
      blobObjectType: process.env.NEXT_PUBLIC_BLOB_OBJECT_TYPE || 'walrus::blob::Blob',
      walrusPackageId: process.env.NEXT_PUBLIC_WALRUS_PACKAGE_ID || '',
      walrusSystemObjectId: process.env.NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT_ID || '',
    }
  },
  testnet: {
    url: getFullnodeUrl('testnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      marketplaceConfigId: process.env.NEXT_PUBLIC_MARKETPLACE_CONFIG_ID || '',
      storageObjectType: process.env.NEXT_PUBLIC_STORAGE_OBJECT_TYPE || 'walrus::storage_resource::Storage',
      blobObjectType: process.env.NEXT_PUBLIC_BLOB_OBJECT_TYPE || 'walrus::blob::Blob',
      walrusPackageId: process.env.NEXT_PUBLIC_WALRUS_PACKAGE_ID || '',
      walrusSystemObjectId: process.env.NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT_ID || '',
    }
  },
  mainnet: {
    url: getFullnodeUrl('mainnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '',
      marketplaceConfigId: process.env.NEXT_PUBLIC_MARKETPLACE_CONFIG_ID || '',
      storageObjectType: process.env.NEXT_PUBLIC_STORAGE_OBJECT_TYPE || 'walrus::storage_resource::Storage',
      blobObjectType: process.env.NEXT_PUBLIC_BLOB_OBJECT_TYPE || 'walrus::blob::Blob',
      walrusPackageId: process.env.NEXT_PUBLIC_WALRUS_PACKAGE_ID || '',
      walrusSystemObjectId: process.env.NEXT_PUBLIC_WALRUS_SYSTEM_OBJECT_ID || '',
    }
  },
})

export {
  networkConfig,
  useNetworkVariable,
  useNetworkVariables,
  network
}
