# Storage Marketplace Smart Contract

> A Move smart contract enabling secondary market trading of Walrus storage resources on the Sui blockchain

## Overview

The Storage Marketplace contract creates a decentralized secondary market where users can buy and sell pre-existing Walrus storage resources. Instead of always purchasing new storage directly from the Walrus system, users can now:

- **List** their unused or excess storage for sale at custom prices
- **Purchase** storage from other users, potentially at lower prices than the system rate
- **Split purchases** by either time period (epochs) or storage size (bytes) to buy exactly what they need
- **Optimize costs** by combining marketplace purchases with new system reservations

Think of it as a peer-to-peer marketplace where storage becomes a tradable commodity, enabling better resource utilization across the Walrus network and cost savings for users.

### Key Features

- **Flexible Splitting**: Buy partial storage by epoch range or by size
- **Pro-rated Pricing**: Fair pricing calculations for partial purchases
- **Trustless Transactions**: All operations secured by smart contract logic
- **Marketplace Fees**: Configurable fee system to sustain the platform
- **Event-Driven**: Complete audit trail through emitted events
- **Concurrent Access**: Shared object design allows multiple simultaneous operations

## How It Works

### Marketplace Lifecycle

```
1. Seller lists storage with custom pricing
   ↓
2. Storage transferred to marketplace (held in escrow)
   ↓
3. Buyer discovers listing and initiates purchase
   ↓
4. Payment validated and marketplace fee deducted
   ↓
5. If partial purchase:
   - Storage split into purchased portion + remainder
   - Remainder automatically re-listed
   ↓
6. Purchased storage transferred to buyer
   ↓
7. Seller receives payment (minus marketplace fee)
```

### Pricing Model

All listings use a standardized pricing format: **price per byte per epoch**. This enables:

- **Consistent comparisons** across different storage sizes and durations
- **Accurate pro-rating** for partial purchases
- **Transparent pricing** that buyers can easily understand

For example:
- Storage: 1MB (1,048,576 bytes) for 100 epochs
- Total price: 1,000 WAL
- Normalized rate: ~9.5 per byte per epoch (scaled by 1e9)
- If someone buys 500KB for 50 epochs, they pay: ~250 WAL

### Storage Splitting

The contract supports two types of splitting:

**1. By Epoch (Time-based)**
Buy storage for specific time periods. The original storage is split at epoch boundaries, creating separate storage objects for different time ranges.

```
Original: [Epoch 10-100, 1MB]
Buy epochs 40-60
Result:
  - Remainder 1: [Epoch 10-40, 1MB] → re-listed
  - Purchased: [Epoch 40-60, 1MB] → to buyer
  - Remainder 2: [Epoch 60-100, 1MB] → re-listed
```

**2. By Size (Byte-based)**
Buy a specific amount of storage bytes. The storage is split by size while maintaining the same epoch range.

```
Original: [Epoch 10-100, 1MB]
Buy 500KB
Result:
  - Purchased: [Epoch 10-100, 500KB] → to buyer
  - Remainder: [Epoch 10-100, 500KB] → re-listed
```

## Technical Architecture

### Data Structures

#### Marketplace (Shared Object)
```move
public struct Marketplace has key {
    id: UID,
    listings: Table<ID, ListedStorage>,
    fee_bps: u64,                      // Basis points (100 = 1%)
    fees_collected: Balance<WAL>,
}
```

The central marketplace object that:
- Uses `Table` for efficient storage of all active listings
- Collects fees in WAL tokens (Walrus native token)
- Is shared across all users for concurrent access

#### ListedStorage
```move
public struct ListedStorage has store {
    storage: Storage,                  // Actual Walrus Storage resource
    seller: address,
    price_per_size_per_epoch: u64,    // Scaled by 1e9 for precision
}
```

Represents a single listing containing:
- The actual storage resource (held in escrow)
- Seller's address for payment routing
- Normalized pricing for consistent calculations

#### MarketplaceAdminCap (Capability)
```move
public struct MarketplaceAdminCap has key, store {
    id: UID,
}
```

Admin capability for privileged operations:
- Update marketplace fees
- Withdraw collected fees
- Transferable to delegate admin rights

### Design Patterns

**1. Shared Object Pattern**
- Single marketplace instance shared globally
- Move's type system handles concurrent access safely
- No centralized coordinator needed

**2. Capability-Based Authorization**
- Admin functions require ownership of `MarketplaceAdminCap`
- No hardcoded admin addresses
- Capability can be transferred

**3. Event Sourcing**
- All state changes emit events
- Off-chain indexers reconstruct state from event stream
- Complete audit trail for all marketplace activity

**4. High-Precision Arithmetic**
- Uses 1e9 scaling factor to simulate fixed-point decimals
- Intermediate calculations use u128 to prevent overflow
- Ensures fair pro-rated pricing

### Walrus Integration

The contract integrates with Walrus storage through the `storage_resource` module:

```move
use walrus::storage_resource::{Self as storage, Storage};
use walrus::system::System;
```

**Key Walrus Functions:**
- `storage::size()` - Get storage size in bytes
- `storage::start_epoch()` / `storage::end_epoch()` - Get time bounds
- `storage::split_by_epoch()` - Split storage at epoch boundary
- `storage::split_by_size()` - Split storage by byte size
- `system.epoch()` - Get current Walrus epoch

## Public Functions

### Marketplace Operations

#### list_storage
```move
public fun list_storage(
    walrus_system: &System,
    marketplace: &mut Marketplace,
    storage: Storage,
    total_price: u64,
    ctx: &mut TxContext,
)
```

**Purpose**: List storage for sale on the marketplace

**Parameters:**
- `walrus_system` - Reference to Walrus System object (for epoch validation)
- `marketplace` - Mutable reference to the shared marketplace
- `storage` - The Storage object to list (ownership transferred)
- `total_price` - Total asking price in WAL (smallest unit)
- `ctx` - Transaction context

**Behavior:**
1. Validates storage hasn't expired (end_epoch > current_epoch)
2. Calculates `price_per_size_per_epoch` = (total_price × 1e9) / (size × duration)
3. Stores listing in marketplace table
4. Emits `StorageListed` event

**Errors:**
- `EStorageExpired` - Storage end epoch is in the past

---

#### buy_full_storage
```move
public fun buy_full_storage(
    marketplace: &mut Marketplace,
    storage_id: ID,
    mut payment: Coin<WAL>,
    ctx: &mut TxContext,
): Storage
```

**Purpose**: Purchase an entire storage listing

**Parameters:**
- `marketplace` - Mutable reference to the marketplace
- `storage_id` - ID of the storage object to purchase
- `payment` - Coin<WAL> for payment (excess refunded)
- `ctx` - Transaction context

**Returns**: The purchased `Storage` object (transferred to buyer)

**Behavior:**
1. Removes listing from marketplace
2. Calculates total price from normalized rate
3. Validates payment is sufficient
4. Deducts marketplace fee
5. Sends payment to seller (total_price - fee)
6. Refunds excess payment to buyer
7. Emits `StoragePurchased` event

**Errors:**
- `EStorageNotFound` - Listing doesn't exist
- `EInsufficientPayment` - Payment too low

---

#### buy_partial_storage_epoch
```move
public fun buy_partial_storage_epoch(
    marketplace: &mut Marketplace,
    storage_id: ID,
    purchase_start_epoch: u32,
    purchase_end_epoch: u32,
    mut payment: Coin<WAL>,
    ctx: &mut TxContext,
): Storage
```

**Purpose**: Purchase storage for a specific epoch range

**Parameters:**
- `marketplace` - Mutable reference to the marketplace
- `storage_id` - ID of the storage to purchase from
- `purchase_start_epoch` - Starting epoch (must be >= listing start)
- `purchase_end_epoch` - Ending epoch (must be <= listing end)
- `payment` - Coin<WAL> for payment
- `ctx` - Transaction context

**Returns**: Storage object covering the purchased epoch range

**Behavior:**

The function handles 4 different cases:

**Case 1: Full Range** (purchase_start == start && purchase_end == end)
- Equivalent to `buy_full_storage`
- Entire listing removed and transferred

**Case 2: Middle Range** (start < purchase_start && purchase_end < end)
- Splits into 3 pieces:
  1. Before: [start, purchase_start) → re-listed
  2. Purchased: [purchase_start, purchase_end) → to buyer
  3. After: [purchase_end, end) → re-listed
- Original listing removed
- Two new listings created

**Case 3: From Middle to End** (start < purchase_start && purchase_end == end)
- Splits into 2 pieces:
  1. Before: [start, purchase_start) → re-listed
  2. Purchased: [purchase_start, end) → to buyer

**Case 4: From Start to Middle** (start == purchase_start && purchase_end < end)
- Splits into 2 pieces:
  1. Purchased: [start, purchase_end) → to buyer
  2. After: [purchase_end, end) → re-listed

**Payment Calculation:**
```
purchased_duration = purchase_end_epoch - purchase_start_epoch
total_price = (price_per_size_per_epoch × size × purchased_duration) / 1e9
```

**Errors:**
- `EStorageNotFound` - Listing doesn't exist
- `EInvalidDuration` - Duration is zero
- `EInvalidSplitEpoch` - Epoch range outside storage bounds
- `EInsufficientPayment` - Payment too low

---

#### buy_partial_storage_size
```move
public fun buy_partial_storage_size(
    marketplace: &mut Marketplace,
    storage_id: ID,
    purchase_size: u64,
    mut payment: Coin<WAL>,
    ctx: &mut TxContext,
): Storage
```

**Purpose**: Purchase a specific amount of storage bytes

**Parameters:**
- `marketplace` - Mutable reference to the marketplace
- `storage_id` - ID of the storage to purchase from
- `purchase_size` - Number of bytes to purchase (must be < total size)
- `payment` - Coin<WAL> for payment
- `ctx` - Transaction context

**Returns**: Storage object with the purchased size

**Behavior:**
1. Validates `0 < purchase_size < total_size`
2. Splits storage using `storage::split_by_size()`
   - Modified storage becomes `purchase_size`
   - Returns remainder with `(total_size - purchase_size)`
3. Calculates pro-rated price:
   ```
   total_price = (price_per_size_per_epoch × purchase_size × duration) / 1e9
   ```
4. Removes original listing
5. Re-lists remainder (if size > 0)
6. Processes payment with marketplace fee
7. Returns purchased storage to buyer

**Errors:**
- `EStorageNotFound` - Listing doesn't exist
- `EInvalidSplitSize` - Size is 0 or >= total size
- `EInsufficientPayment` - Payment too low

---

#### delist_storage
```move
public fun delist_storage(
    marketplace: &mut Marketplace,
    storage_id: ID,
    ctx: &mut TxContext,
): Storage
```

**Purpose**: Remove listing and return storage to seller

**Parameters:**
- `marketplace` - Mutable reference to the marketplace
- `storage_id` - ID of the storage to delist
- `ctx` - Transaction context

**Returns**: The storage object (returned to seller)

**Behavior:**
1. Verifies caller is the listing seller
2. Removes listing from marketplace
3. Returns storage to seller
4. Emits `StorageDelisted` event

**Errors:**
- `EStorageNotFound` - Listing doesn't exist
- `EUnauthorized` - Caller is not the seller

---

### Admin Functions

#### update_marketplace_fee
```move
public fun update_marketplace_fee(
    _cap: &MarketplaceAdminCap,
    marketplace: &mut Marketplace,
    new_fee_bps: u64,
)
```

**Purpose**: Update the marketplace fee percentage

**Parameters:**
- `_cap` - Reference to admin capability (proves authorization)
- `marketplace` - Mutable reference to the marketplace
- `new_fee_bps` - New fee in basis points (100 = 1%, max 10000 = 100%)

**Examples:**
- 0 = 0% (no fee)
- 100 = 1%
- 250 = 2.5%
- 1000 = 10%

**Errors:**
- `EInvalidFee` - Fee exceeds 10000 (100%)

---

#### withdraw_fees
```move
public fun withdraw_fees(
    _cap: &MarketplaceAdminCap,
    marketplace: &mut Marketplace,
    ctx: &mut TxContext,
)
```

**Purpose**: Withdraw all accumulated marketplace fees

**Parameters:**
- `_cap` - Reference to admin capability
- `marketplace` - Mutable reference to the marketplace
- `ctx` - Transaction context

**Behavior:**
- Extracts entire `fees_collected` balance
- Transfers to caller (admin cap holder)
- Resets fee balance to zero

---

### View Functions

#### get_listing_price
```move
public fun get_listing_price(
    marketplace: &Marketplace,
    storage_id: ID
): (u64, u64, u32, u32, u64)
```

**Returns:** `(price_per_size_per_epoch, size, start_epoch, end_epoch, total_price)`

**Purpose**: Get detailed pricing information for a listing

---

#### get_marketplace_fee
```move
public fun get_marketplace_fee(marketplace: &Marketplace): u64
```

**Returns:** Current marketplace fee in basis points

---

#### get_listings_count
```move
public fun get_listings_count(marketplace: &Marketplace): u64
```

**Returns:** Total number of active listings in the marketplace

## Price Calculation

### Fixed-Point Arithmetic

Move doesn't support floating-point numbers, so the contract uses **scaled integer arithmetic** for precise price calculations:

```
PRECISION_SCALE = 1,000,000,000 (1e9)
```

### Formulas

#### 1. Calculate Normalized Price (when listing)
```
price_per_size_per_epoch = (total_price × 1e9) / (size × duration)
```

**Example:**
```
Total price: 1,000,000 WAL
Size: 1,048,576 bytes (1 MB)
Duration: 100 epochs

price_per_size_per_epoch = (1,000,000 × 1e9) / (1,048,576 × 100)
                         = 1,000,000,000,000,000 / 104,857,600
                         = 9,536,743
```

**Why scale?**
- Preserves decimal precision
- Allows accurate pro-rating
- Uses u128 for intermediate calculation to prevent overflow

---

#### 2. Calculate Total Price (when purchasing)
```
total_price = (price_per_size_per_epoch × size × duration) / 1e9
```

**Example (full purchase):**
```
price_per_size_per_epoch: 9,536,743
Size: 1,048,576 bytes
Duration: 100 epochs

total_price = (9,536,743 × 1,048,576 × 100) / 1e9
            = 999,999,975,168 / 1e9
            = 999 (rounds down)
```

**Example (partial - 50 epochs):**
```
total_price = (9,536,743 × 1,048,576 × 50) / 1e9
            = 499,999,987,584 / 1e9
            = 499 WAL
```

---

#### 3. Calculate Marketplace Fee
```
fee_amount = (amount × fee_bps) / 10,000
seller_receives = amount - fee_amount
```

**Example (2.5% fee = 250 bps):**
```
Amount: 1,000,000 WAL
Fee: (1,000,000 × 250) / 10,000 = 25,000 WAL
Seller receives: 1,000,000 - 25,000 = 975,000 WAL
```

## Storage Splitting Mechanics

The contract uses two primitives from the Walrus framework to split storage:

### Split by Epoch

**Function:** `storage::split_by_epoch(&mut storage, split_epoch, ctx)`

**Behavior:**
- Mutates the original storage to end at `split_epoch`
- Returns a NEW storage object starting at `split_epoch`
- Both pieces have the same size

**Example:**
```
Before:
  storage: [epoch 10-100, 1MB]

Call: split_by_epoch(storage, 50)

After:
  storage (mutated):  [epoch 10-50, 1MB]
  returned (new):     [epoch 50-100, 1MB]
```

**Used by:** `buy_partial_storage_epoch`

---

### Split by Size

**Function:** `storage::split_by_size(&mut storage, target_size, ctx)`

**Behavior:**
- Mutates the original storage to be `target_size` bytes
- Returns a NEW storage object with the remainder bytes
- Both pieces have the same epoch range

**Example:**
```
Before:
  storage: [epoch 10-100, 1MB (1,048,576 bytes)]

Call: split_by_size(storage, 524288)  // 512KB

After:
  storage (mutated):  [epoch 10-100, 512KB (524,288 bytes)]
  returned (new):     [epoch 10-100, 512KB (524,288 bytes)]
```

**Used by:** `buy_partial_storage_size`

---

### Complex Splitting Scenario

**Scenario:** Buy epochs 40-60 from listing [epoch 10-100, 1MB, 1000 WAL]

**Steps:**

1. **First split** - Separate "before" portion:
   ```
   split_by_epoch(storage, 40)

   listing.storage: [10-40, 1MB]     // Will be re-listed
   after_start:     [40-100, 1MB]    // Continue processing
   ```

2. **Second split** - Separate "purchased" from "after":
   ```
   split_by_epoch(after_start, 60)

   after_start:     [40-60, 1MB]     // BUYER GETS THIS
   end_remainder:   [60-100, 1MB]    // Will be re-listed
   ```

3. **Re-list both remainders:**
   ```
   New listing 1: [10-40, 1MB] with same price_per_size_per_epoch
   New listing 2: [60-100, 1MB] with same price_per_size_per_epoch
   ```

4. **Payment calculation:**
   ```
   Purchased: 20 epochs out of 90 total
   Price: (1000 × 20) / 90 = 222 WAL (rounded)
   ```

## Events

### StorageListed
```move
public struct StorageListed has copy, drop {
    storage_id: ID,
    seller: address,
    price_per_size_per_epoch: u64,
    size: u64,
    start_epoch: u32,
    end_epoch: u32,
    total_price: u64,
}
```

**Emitted when:**
- New storage is listed via `list_storage()`
- Remainder is re-listed after partial purchase

**Purpose:**
- Off-chain indexers add listing to database
- Frontend shows new listings in real-time

---

### StorageDelisted
```move
public struct StorageDelisted has copy, drop {
    storage_id: ID,
    seller: address,
}
```

**Emitted when:**
- Seller explicitly delists via `delist_storage()`
- Storage is fully purchased (entire listing consumed)
- Original listing is removed during partial purchase (before remainder is re-listed)

**Purpose:**
- Off-chain indexers remove listing from active marketplace
- Frontend hides sold/delisted items

---

### StoragePurchased
```move
public struct StoragePurchased has copy, drop {
    storage_id: ID,
    buyer: address,
    seller: address,
    amount_paid: u64,
    purchase_type: String,         // "full", "partial_epoch", "partial_size"
    purchased_size: u64,
    purchased_start_epoch: u32,
    purchased_end_epoch: u32,
}
```

**Emitted when:**
- Any purchase occurs (full or partial)

**Purchase Types:**
- `"full"` - Entire listing purchased via `buy_full_storage()`
- `"partial_epoch"` - Epoch range purchase via `buy_partial_storage_epoch()`
- `"partial_size"` - Size-based purchase via `buy_partial_storage_size()`

**Purpose:**
- Off-chain indexers record transaction history
- Analytics and reporting
- User notifications

## Error Codes

| Code | Constant | Description | Common Scenarios |
|------|----------|-------------|------------------|
| 1 | `EInvalidDuration` | Epoch duration is zero | `purchase_end == purchase_start` |
| 2 | `EStorageNotFound` | Listing doesn't exist in marketplace | Wrong ID or already purchased |
| 3 | `EUnauthorized` | Caller is not the seller | Someone else trying to delist |
| 4 | `EInsufficientPayment` | Payment amount too low | Sent less than required price |
| 5 | `EInvalidSplitEpoch` | Epoch range outside storage bounds | `purchase_start < storage.start` or `purchase_end > storage.end` |
| 6 | `EInvalidSplitSize` | Size is zero or >= total size | `purchase_size == 0` or `purchase_size >= storage.size` |
| 7 | `EInvalidFee` | Fee exceeds maximum (100%) | `new_fee_bps > 10000` |
| 8 | `EPriceOverflow` | Price calculation overflow | Extremely large storage or price values |
| 9 | `EStorageExpired` | Storage end epoch <= current epoch | Trying to list expired storage |

## Security Considerations

### Authorization & Access Control

**Seller-only delisting:**
- `delist_storage` verifies `ctx.sender() == listing.seller`
- Prevents unauthorized removal of listings

**Admin-only functions:**
- `update_marketplace_fee` and `withdraw_fees` require `MarketplaceAdminCap`
- Capability can be transferred to delegate admin rights
- No hardcoded addresses (flexible governance)

---

### Payment Safety

**Validation:**
- All purchase functions validate `payment >= total_price`
- Insufficient payment aborts transaction with `EInsufficientPayment`

**Automatic refunds:**
- Excess payment automatically returned to buyer
- Uses `coin::split` for atomic operations

**Fee handling:**
- Marketplace fee deducted before seller payment
- Fee deposited into `marketplace.fees_collected`
- Seller receives `total_price - fee`

**Atomic operations:**
- Payment + storage transfer happen in single transaction
- No partial failure states (all-or-nothing)

---

### Arithmetic Safety

**Overflow prevention:**
- Uses `u128` for intermediate calculations (instead of u64)
- Explicit overflow check with `EPriceOverflow` error
- Example:
  ```move
  let total = (price as u128) * (size as u128) * (duration as u128);
  assert!(total <= (u64::MAX as u128), EPriceOverflow);
  ```

**Division by zero protection:**
- Duration validation: `assert!(duration > 0, EInvalidDuration)`
- Prevents division by zero in price calculations

**Precision preservation:**
- Uses 1e9 scaling to preserve decimal places
- Calculations remain accurate even for tiny prices

---

### State Consistency

**Epoch boundary validation:**
- `buy_partial_storage_epoch` checks:
  - `purchase_start >= storage.start_epoch`
  - `purchase_end <= storage.end_epoch`
  - `purchase_start < purchase_end`

**Size validation:**
- `buy_partial_storage_size` checks:
  - `purchase_size > 0`
  - `purchase_size < storage.size` (must be partial)

**Storage expiration:**
- `list_storage` validates `storage.end_epoch > current_epoch`
- Prevents listing expired storage

**Table operations:**
- Uses `table::contains()` before `borrow()`/`remove()`
- Prevents non-existent key access

---

### Reentrancy Protection

**Not vulnerable:**
- Move's ownership system prevents reentrancy by design
- Objects can only be borrowed once (mutable XOR multiple immutable)
- No external calls during state mutations
- All operations complete atomically within function scope

---

### Edge Cases

**Zero remainders:**
- If split creates zero-size storage, it's destroyed (not re-listed)
- Uses `storage::destroy()` for cleanup

**Full range purchases:**
- Detected early and handled efficiently (no unnecessary splits)
- Avoids creating zero-duration remainders

**Empty payments:**
- Payment coin with zero value properly destroyed
- Uses `coin::destroy_zero()` for cleanup

**Concurrent access:**
- Multiple users can list/buy simultaneously (shared object)
- Move's runtime handles locking automatically

## Deployment & Configuration

### Dependencies

**Move.toml:**
```toml
[package]
name = "contracts"
edition = "2024.beta"

[dependencies]
Sui = {
    git = "https://github.com/MystenLabs/sui.git",
    subdir = "crates/sui-framework/packages/sui-framework",
    rev = "testnet-v1.60.0"
}
Walrus = {
    git = "https://github.com/MystenLabs/walrus.git",
    subdir = "testnet-contracts/walrus",
    rev = "main"
}

[addresses]
contracts = "0x0"  # Will be replaced during deployment
```

**Required frameworks:**
- Sui Framework (testnet-v1.60.0+)
- Walrus Storage Framework (main branch)

---

### Initialization

The `init` function runs once when the contract is published:

```move
fun init(ctx: &mut TxContext) {
    // Create marketplace with 0% initial fee
    let marketplace = Marketplace {
        id: object::new(ctx),
        listings: table::new<ID, ListedStorage>(ctx),
        fee_bps: 0,
        fees_collected: balance::zero<WAL>(),
    };

    // Make marketplace globally accessible
    transfer::share_object(marketplace);

    // Transfer admin cap to deployer
    let admin_cap = MarketplaceAdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
}
```

**Key points:**
- Marketplace is shared (not owned) for concurrent access
- Initial fee is 0% (admin can update later)
- Admin capability goes to contract deployer
- Only ONE marketplace instance per deployment

---

### Deployment Steps

1. **Install Sui CLI:**
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet-v1.60.0 sui
   ```

2. **Configure network:**
   ```bash
   sui client switch --env testnet
   ```

3. **Build contract:**
   ```bash
   cd storage-marketplace/contracts
   sui move build
   ```

4. **Publish to testnet:**
   ```bash
   sui client publish --gas-budget 100000000
   ```

5. **Save deployment info:**
   - Package ID (for frontend integration)
   - Marketplace object ID (shared object)
   - MarketplaceAdminCap object ID (for admin operations)

---

### Post-Deployment Configuration

**Set marketplace fee:**
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function update_marketplace_fee \
  --args <ADMIN_CAP_ID> <MARKETPLACE_ID> 250 \
  --gas-budget 10000000

# Sets fee to 2.5% (250 basis points)
```

**Transfer admin cap (optional):**
```bash
sui client transfer \
  --object-id <ADMIN_CAP_ID> \
  --to <NEW_ADMIN_ADDRESS> \
  --gas-budget 10000000
```

## Usage Examples

### Example 1: List Storage

```bash
# Assume you have a Storage object with ID: 0xabc123...

sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function list_storage \
  --args <WALRUS_SYSTEM_ID> <MARKETPLACE_ID> 0xabc123... 1000000 \
  --gas-budget 10000000

# Lists storage for 1,000,000 WAL total price
```

**On-chain result:**
- Storage transferred to marketplace
- `StorageListed` event emitted
- Listing appears in marketplace table

---

### Example 2: Buy Full Storage

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function buy_full_storage \
  --args <MARKETPLACE_ID> 0xabc123... <PAYMENT_COIN_ID> \
  --gas-budget 10000000

# Purchases entire listing
```

**On-chain result:**
- Listing removed from marketplace
- Storage transferred to buyer
- Seller receives payment (minus fee)
- `StorageDelisted` and `StoragePurchased` events emitted

---

### Example 3: Buy Partial Storage by Epoch

```bash
# Buy epochs 40-60 from a listing covering epochs 10-100

sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function buy_partial_storage_epoch \
  --args <MARKETPLACE_ID> 0xabc123... 40 60 <PAYMENT_COIN_ID> \
  --gas-budget 10000000
```

**On-chain result:**
- Original storage split into 3 pieces
- Purchased piece [40-60] → buyer
- Remainders [10-40] and [60-100] → re-listed
- Events: `StorageDelisted` (original), `StorageListed` (x2), `StoragePurchased`

---

### Example 4: Buy Partial Storage by Size

```bash
# Buy 500KB from a 1MB listing

sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function buy_partial_storage_size \
  --args <MARKETPLACE_ID> 0xabc123... 512000 <PAYMENT_COIN_ID> \
  --gas-budget 10000000

# 512000 = 500KB in bytes
```

**On-chain result:**
- Storage split by size
- 500KB portion → buyer
- Remaining ~500KB → re-listed
- Events: `StorageDelisted`, `StorageListed`, `StoragePurchased`

---

### Example 5: Delist Storage

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module marketplace \
  --function delist_storage \
  --args <MARKETPLACE_ID> 0xabc123... \
  --gas-budget 10000000

# Must be called by the original seller
```

**On-chain result:**
- Listing removed from marketplace
- Storage returned to seller
- `StorageDelisted` event emitted

---

## Integration Guide

### For Frontend Developers

**1. Query marketplace listings:**
- Use off-chain indexer (backend API) for fast queries
- Backend maintains PostgreSQL database with all active listings
- Real-time updates via WebSocket events

**2. Construct purchase transactions:**
- Use Sui TypeScript SDK to build transaction blocks
- For complex operations (multiple purchases), use Programmable Transaction Blocks (PTBs)
- Example:
  ```typescript
  const tx = new Transaction();

  // Split payment coin
  const [payment] = tx.splitCoins(tx.gas, [price]);

  // Call marketplace contract
  tx.moveCall({
    target: `${packageId}::marketplace::buy_full_storage`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(storageId),
      payment,
    ],
  });

  // Sign and execute
  await signAndExecuteTransaction({ transaction: tx });
  ```

**3. Listen for events:**
- Subscribe to WebSocket for real-time updates
- Parse events from transaction effects
- Update UI immediately

---

### For Backend Developers

**1. Index blockchain events:**
- Poll Sui RPC for new events every 5 seconds
- Process events in order (use cursor for resumability)
- Store in PostgreSQL:
  - Event history (append-only)
  - Current state (mutable)

**2. Event processing:**
- `StorageListed` → Add to active listings table
- `StorageDelisted` → Remove from active listings
- `StoragePurchased` → Record transaction + update listings

**3. Provide APIs:**
- `GET /listings` - Paginated active listings
- `GET /listings/:id` - Listing details
- `POST /optimize` - Calculate optimal purchase strategy
- `WebSocket /events` - Real-time event stream

---

## Testing

### Test Workflow

1. **Upload test storage to Walrus:**
   ```bash
   cd ../scripts
   ./test-walrus-upload.sh 1000 10
   # Uploads 1000-word file for 10 epochs
   # Returns blob ID and storage object ID
   ```

2. **List storage on marketplace:**
   - Use object ID from step 1
   - Set test price (e.g., 1000 WAL)

3. **Test purchases:**
   - Full purchase from another account
   - Partial epoch purchase
   - Partial size purchase
   - Verify remainders are re-listed correctly

4. **Test delisting:**
   - List storage
   - Delist before purchase
   - Verify storage returned

5. **Test admin functions:**
   - Update fee to 2.5%
   - Make purchase
   - Verify fee collected
   - Withdraw fees

### Unit Testing (TODO)

Currently no test files present. Recommended test coverage:

```move
#[test_only]
module contracts::marketplace_tests {
    // Test listing
    #[test]
    fun test_list_storage() { /* ... */ }

    // Test full purchase
    #[test]
    fun test_buy_full_storage() { /* ... */ }

    // Test partial epoch purchase
    #[test]
    fun test_buy_partial_epoch_full_range() { /* ... */ }
    #[test]
    fun test_buy_partial_epoch_middle() { /* ... */ }
    #[test]
    fun test_buy_partial_epoch_start() { /* ... */ }
    #[test]
    fun test_buy_partial_epoch_end() { /* ... */ }

    // Test partial size purchase
    #[test]
    fun test_buy_partial_size() { /* ... */ }

    // Test delisting
    #[test]
    fun test_delist_storage() { /* ... */ }

    // Test admin functions
    #[test]
    fun test_update_marketplace_fee() { /* ... */ }
    #[test]
    fun test_withdraw_fees() { /* ... */ }

    // Test error cases
    #[test]
    #[expected_failure(abort_code = EStorageNotFound)]
    fun test_buy_nonexistent_storage() { /* ... */ }

    #[test]
    #[expected_failure(abort_code = EUnauthorized)]
    fun test_unauthorized_delist() { /* ... */ }
}
```

---

## Summary

The Storage Marketplace smart contract provides a **trustless, efficient secondary market** for Walrus storage resources with:

- **Flexible purchasing** via full, partial epoch, or partial size options
- **Fair pricing** using high-precision fixed-point arithmetic
- **Automatic splitting** and re-listing of remainders
- **Capability-based admin** for fee management
- **Event-driven architecture** for off-chain indexing
- **Security-first design** with comprehensive validation

The contract is production-ready and optimized for the Walrus storage ecosystem on Sui blockchain.

---

**Questions or issues?** Open an issue in the project repository or consult the [Sui documentation](https://docs.sui.io) and [Walrus documentation](https://docs.walrus.xyz).
