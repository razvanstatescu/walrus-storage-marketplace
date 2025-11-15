# Changelog

All notable changes to the Storewave SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-15

### Added

- **Core SDK Class**
  - `WalStorageMarketplace` main class with testnet and mainnet support
  - Network configuration with built-in RPC endpoints and contract addresses

- **Storage Reservation Features**
  - `getReservationCost()` - Preview storage costs with marketplace optimization
  - `reserveStorage()` - Reserve storage with automatic coin fetching and dry run simulation
  - Automatic epoch management (uses current epoch automatically)
  - Dry run simulation with automatic system-only fallback
  - Marketplace + system hybrid optimization for best prices

- **Wallet Query Features**
  - `getWalletStorage()` - Fetch storage objects with pagination
  - `getWalletBlobs()` - Fetch blob objects with pagination
  - `getWalBalance()` - Get WAL token balance
  - `getWalCoins()` - Get WAL coin objects
  - `getCurrentEpoch()` - Get current Walrus epoch

- **Marketplace Features**
  - `getListingsByAddress()` - Query marketplace listings by seller
  - `listStorage()` - List multiple storage objects on marketplace
  - `listBlobAsStorage()` - Delete blobs and list as storage

- **Utility Functions**
  - Storage unit conversions (bytes, KiB, MiB, GiB, TiB)
  - Currency conversions (FROST ↔ WAL)
  - Input validation
  - Formatting helpers

- **Type Definitions**
  - Complete TypeScript type coverage
  - Exported types for all API interfaces
  - Custom error classes with inheritance

- **Examples**
  - React component examples (StorageReservation, WalletStorage)
  - Node.js usage examples

- **Documentation**
  - Comprehensive README with API reference
  - Code examples for common use cases
  - Best practices guide

### Network Support

- **Testnet**: Fully configured with all contract addresses
- **Mainnet**: Placeholder configuration (to be filled on launch)

### Technical Features

- Dual ESM/CJS build output for universal compatibility
- Full TypeScript with strict mode
- Browser and Node.js support
- Automatic WAL coin management (merge and split)
- Backend API integration for cost optimization
- PTB (Programmable Transaction Block) building
- Comprehensive error handling

### Dependencies

- `@mysten/sui`: ^1.16.0
- `@mysten/walrus`: ^0.5.0

---

## Future Roadmap

### [0.2.0] - Planned

- Add mainnet configuration when network launches
- Add tests (unit and integration)
- Add more detailed analytics methods
- Add transaction history queries
- Add webhook support for listing updates

### [0.3.0] - Planned

- Add support for batch operations
- Add transaction retry logic
- Add gas optimization features
- Add caching layer for better performance

---

## Support

For issues, questions, or contributions, please visit the project repository.
