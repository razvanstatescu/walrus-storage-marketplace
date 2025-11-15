# Storewave SDK

TypeScript SDK for the Walrus Storage Marketplace on Sui blockchain. Reserve storage efficiently by combining marketplace listings with direct system purchases.

## Features

- **Smart Storage Reservation** - Automatically optimizes costs by combining marketplace listings with system purchases
- **Dry Run Simulation** - Validates transactions before execution with automatic fallback
- **Auto Coin Management** - Automatically fetches and manages WAL token coins
- **Type-Safe** - Full TypeScript support with comprehensive type definitions
- **Universal** - Works in both browser (React) and Node.js environments
- **Marketplace Integration** - List, query, and purchase storage on the marketplace
- **Wallet Queries** - Easily fetch storage and blob objects from any wallet

## Installation

```bash
npm install storewave-sdk
```

## Quick Start

### Initialize SDK

```typescript
import { WalStorageMarketplace } from 'storewave-sdk';

// Initialize for testnet
const sdk = new WalStorageMarketplace('testnet', {
  backendApiUrl: 'http://localhost:3000', // Optional
});
```

### Reserve Storage (Simple)

```typescript
import { Transaction } from '@mysten/sui/transactions';

// Get cost preview first
const cost = await sdk.getReservationCost({
  size: 5,
  sizeUnit: 'GiB',
  durationInEpochs: 100,
});

console.log(`Optimized cost: ${cost.optimizedRoute.totalCostInWal} WAL`);
console.log(`System-only cost: ${cost.systemOnlyRoute.totalCostInWal} WAL`);
console.log(`You save: ${cost.savingsInWal} WAL (${cost.savingsPercentage}%)`);

// Reserve storage
const tx = new Transaction();
const result = await sdk.reserveStorage({
  tx,
  size: 5,
  sizeUnit: 'GiB',
  durationInEpochs: 100,
  senderAddress: walletAddress,
  // WAL coins are automatically fetched!
});

// Sign and execute transaction
await signAndExecuteTransaction({ transaction: result.transaction });
```

## API Reference

### Constructor

```typescript
new WalStorageMarketplace(network: 'testnet' | 'mainnet', options?: {
  rpcUrl?: string;
  backendApiUrl?: string;
})
```

### Storage Reservation

#### `getReservationCost()`

Get cost preview for storage reservation with marketplace optimization.

```typescript
const cost = await sdk.getReservationCost({
  size: 5,
  sizeUnit: 'GiB',        // 'bytes' | 'KiB' | 'MiB' | 'GiB' | 'TiB'
  durationInEpochs: 100,
});

// Returns:
// {
//   optimizedRoute: {
//     totalCostInFrost: bigint,
//     totalCostInWal: number,
//     operations: Operation[],
//     usesMarketplace: boolean
//   },
//   systemOnlyRoute: {
//     totalCostInFrost: bigint,
//     totalCostInWal: number,
//     storageUnits: number
//   },
//   savingsInFrost: bigint,
//   savingsInWal: number,
//   savingsPercentage: number,
//   recommendation: 'optimized' | 'system-only',
//   currentEpoch: number,
//   endEpoch: number
// }
```

**Key Features:**
- Automatically uses current epoch as start epoch
- Compares marketplace vs system-only costs
- Shows potential savings
- Provides optimization recommendation

#### `reserveStorage()`

Reserve storage with automatic coin fetching and dry run simulation.

```typescript
const tx = new Transaction();

const result = await sdk.reserveStorage({
  tx,
  size: 5,
  sizeUnit: 'GiB',
  durationInEpochs: 100,
  senderAddress: walletAddress,
  useOptimization: true,      // Default: true
  performDryRun: true,        // Default: true
});

// Returns:
// {
//   transaction: Transaction,
//   dryRunResult?: {
//     success: boolean,
//     usedSystemFallback: boolean,
//     error?: string
//   },
//   estimatedCostInFrost: bigint,
//   estimatedCostInWal: number,
//   currentEpoch: number,
//   endEpoch: number
// }
```

**Key Features:**
- Automatically fetches WAL coins from wallet
- Automatically uses current epoch
- Performs dry run simulation
- Auto-fallback to system-only if marketplace fails
- Returns ready-to-sign transaction

### Wallet Queries

#### `getWalletStorage()`

Get storage objects owned by an address.

```typescript
const storage = await sdk.getWalletStorage({
  address: walletAddress,
  cursor?: string,
  limit?: number,           // Default: 20, Max: 100
});

// Returns paginated storage objects
// {
//   data: WalrusStorage[],
//   nextCursor: string | null,
//   hasMore: boolean
// }
```

#### `getWalletBlobs()`

Get blob objects owned by an address.

```typescript
const blobs = await sdk.getWalletBlobs({
  address: walletAddress,
  cursor?: string,
  limit?: number,
});

// Returns paginated blob objects
```

#### `getWalBalance()`

Get WAL token balance.

```typescript
const balance = await sdk.getWalBalance(walletAddress);
// Returns balance in FROST (smallest unit)
```

#### `getWalCoins()`

Get WAL coin objects.

```typescript
const coins = await sdk.getWalCoins(walletAddress);
// Returns array of CoinStruct
```

### Marketplace Operations

#### `getListingsByAddress()`

Get marketplace listings for a seller.

```typescript
const listings = await sdk.getListingsByAddress({
  address: sellerAddress,
  cursor?: string,
  limit?: number,
});

// Returns paginated listings
```

#### `listStorage()`

List storage objects on the marketplace.

```typescript
const tx = new Transaction();

await sdk.listStorage({
  tx,
  storageObjectIds: ['0x...', '0x...'],
  pricesInWal: [1.5, 2.0],
  senderAddress: walletAddress,
});

// Returns modified transaction
```

#### `listBlobAsStorage()`

List blobs as storage (deletes blob first, then lists storage).

```typescript
const tx = new Transaction();

await sdk.listBlobAsStorage({
  tx,
  blobObjectIds: ['0x...'],
  pricesInWal: [1.5],
  senderAddress: walletAddress,
});
```

### Utility Functions

#### `getCurrentEpoch()`

Get current Walrus epoch.

```typescript
const epoch = await sdk.getCurrentEpoch();
```

## Usage Examples

### React Example

```typescript
import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { WalStorageMarketplace } from 'storewave-sdk';

function StorageReservation() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [cost, setCost] = useState(null);

  const sdk = new WalStorageMarketplace('testnet', {
    backendApiUrl: 'http://localhost:3000'
  });

  const handleGetCost = async () => {
    const result = await sdk.getReservationCost({
      size: 5,
      sizeUnit: 'GiB',
      durationInEpochs: 100,
    });
    setCost(result);
  };

  const handleReserve = async () => {
    const tx = new Transaction();

    const result = await sdk.reserveStorage({
      tx,
      size: 5,
      sizeUnit: 'GiB',
      durationInEpochs: 100,
      senderAddress: currentAccount.address,
    });

    if (result.dryRunResult?.usedSystemFallback) {
      console.warn('Used system-only fallback');
    }

    await signAndExecuteTransaction({ transaction: result.transaction });
  };

  return (
    <div>
      <button onClick={handleGetCost}>Get Cost</button>
      {cost && (
        <div>
          <p>Optimized: {cost.optimizedRoute.totalCostInWal} WAL</p>
          <p>Savings: {cost.savingsInWal} WAL ({cost.savingsPercentage}%)</p>
        </div>
      )}
      <button onClick={handleReserve}>Reserve Storage</button>
    </div>
  );
}
```

### Node.js Example

```typescript
import { WalStorageMarketplace } from 'storewave-sdk';
import { Transaction } from '@mysten/sui/transactions';

const sdk = new WalStorageMarketplace('testnet');

// Get wallet storage
const storage = await sdk.getWalletStorage({
  address: '0x...',
  limit: 20,
});

console.log(`Found ${storage.data.length} storage objects`);

// Get cost preview
const cost = await sdk.getReservationCost({
  size: 10,
  sizeUnit: 'GiB',
  durationInEpochs: 200,
});

console.log(`Cost: ${cost.optimizedRoute.totalCostInWal} WAL`);
console.log(`Savings: ${cost.savingsPercentage}%`);

// Create reservation transaction
const tx = new Transaction();
const result = await sdk.reserveStorage({
  tx,
  size: 10,
  sizeUnit: 'GiB',
  durationInEpochs: 200,
  senderAddress: '0x...',
});

console.log(`Transaction ready to sign`);
```

## Type Definitions

The SDK exports all TypeScript types:

```typescript
import type {
  Network,
  SDKOptions,
  SizeUnit,
  WalrusStorage,
  WalrusBlob,
  ListedStorage,
  PaginatedStorage,
  Operation,
  OptimizationResult,
} from 'storewave-sdk';
```

## Error Handling

The SDK provides custom error classes:

```typescript
import {
  StorewaveError,
  InsufficientBalanceError,
  NoWalCoinsError,
  DryRunFailureError,
  BackendError,
  ValidationError,
  UnsupportedNetworkError,
} from 'storewave-sdk';

try {
  await sdk.reserveStorage({...});
} catch (error) {
  if (error instanceof NoWalCoinsError) {
    console.error('No WAL tokens in wallet');
  } else if (error instanceof DryRunFailureError) {
    console.error('Transaction would fail:', error.dryRunError);
  } else if (error instanceof BackendError) {
    console.error('Backend API error:', error.message);
  }
}
```

## Utility Functions

The SDK also exports utility functions for advanced use cases:

```typescript
import {
  convertToBytes,
  convertToStorageUnits,
  formatStorageSize,
  frostToWal,
  walToFrost,
  formatWalPrice,
  BYTES_PER_UNIT_SIZE,
  FROST_PER_WAL,
} from 'storewave-sdk';

// Convert units
const bytes = convertToBytes(5, 'GiB'); // 5368709120
const storageUnits = convertToStorageUnits(bytes); // 5120 MiB

// Format for display
const formatted = formatStorageSize(5368709120n); // "5.00 GiB (5120 storage units)"

// Currency conversions
const wal = frostToWal(1500000000n); // 1.5
const frost = walToFrost(1.5); // 1500000000n
const price = formatWalPrice(1500000000n); // "1.5000"
```

## Network Configuration

### Testnet (Active)

```typescript
const sdk = new WalStorageMarketplace('testnet', {
  backendApiUrl: 'http://localhost:3000', // or your backend URL
});
```

### Mainnet (Placeholder)

```typescript
const sdk = new WalStorageMarketplace('mainnet', {
  backendApiUrl: 'https://api.yourbackend.com',
});
```

Note: Mainnet configuration will be added when the network launches.

## Advanced Usage

### Custom RPC URL

```typescript
const sdk = new WalStorageMarketplace('testnet', {
  rpcUrl: 'https://your-custom-rpc.com',
  backendApiUrl: 'http://localhost:3000',
});
```

### Skip Optimization (System-Only)

```typescript
const result = await sdk.reserveStorage({
  tx,
  size: 5,
  sizeUnit: 'GiB',
  durationInEpochs: 100,
  senderAddress: walletAddress,
  useOptimization: false, // Use system-only route
});
```

### Skip Dry Run

```typescript
const result = await sdk.reserveStorage({
  tx,
  size: 5,
  sizeUnit: 'GiB',
  durationInEpochs: 100,
  senderAddress: walletAddress,
  performDryRun: false, // Skip simulation
});
```

## How It Works

1. **Cost Optimization**: The SDK queries the backend optimizer API to find the cheapest combination of marketplace listings and system purchases.

2. **Automatic Coin Management**: The SDK automatically fetches all WAL coins from your wallet, merges them, and splits them for payments.

3. **Dry Run Simulation**: Before executing, the SDK simulates the transaction. If it would fail (e.g., marketplace listings became unavailable), it automatically rebuilds the transaction using system-only purchases.

4. **PTB Construction**: The SDK builds a Programmable Transaction Block (PTB) that:
   - Buys storage from marketplace listings
   - Reserves additional storage from the system if needed
   - Fuses multiple storage pieces into one
   - Transfers the final storage object to your wallet

## Best Practices

1. **Always get cost preview first** to inform users of the price
2. **Handle dry run failures** gracefully with user feedback
3. **Check for system fallback** to notify users when marketplace is unavailable
4. **Paginate large queries** to avoid memory issues
5. **Use TypeScript** for type safety and better developer experience

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing patterns
- All types are properly exported
- Examples are updated for new features
- Tests are added for new functionality

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [repo-link]
- Documentation: [docs-link]
