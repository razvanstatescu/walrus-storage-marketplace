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
      walTokenType: process.env.NEXT_PUBLIC_WAL_TOKEN_TYPE || '0x2::sui::SUI',
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
      walTokenType: process.env.NEXT_PUBLIC_WAL_TOKEN_TYPE || '0x2::sui::SUI',
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
      walTokenType: process.env.NEXT_PUBLIC_WAL_TOKEN_TYPE || '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL',
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
      walTokenType: process.env.NEXT_PUBLIC_WAL_TOKEN_TYPE || '0x2::sui::SUI',
    }
  },
})

export {
  networkConfig,
  useNetworkVariable,
  useNetworkVariables,
  network
}
