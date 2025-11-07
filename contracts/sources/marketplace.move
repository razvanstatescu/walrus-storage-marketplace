module contracts::marketplace;

// Sui framework imports
use sui::table::{Self, Table};
use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};
use sui::event;
use std::string::{Self, String};

// Walrus imports
use walrus::storage_resource::{Self as storage, Storage};

// WAL coin import
use wal::wal::WAL;

// ====== Constants ======

/// Precision scale for price calculations (1e9)
const PRECISION_SCALE: u64 = 1_000_000_000;

/// Maximum marketplace fee in basis points (100% = 10000)
const MAX_FEE_BPS: u64 = 10000;

// ====== Error Codes ======

/// Invalid duration (epochs must be > 0)
const EInvalidDuration: u64 = 1;

/// Storage not found in listings
const EStorageNotFound: u64 = 2;

/// Unauthorized action (not the seller)
const EUnauthorized: u64 = 3;

/// Insufficient payment amount
const EInsufficientPayment: u64 = 4;

/// Invalid split epoch (must be within storage bounds)
const EInvalidSplitEpoch: u64 = 5;

/// Invalid split size (must be less than storage size)
const EInvalidSplitSize: u64 = 6;

/// Invalid marketplace fee (exceeds maximum)
const EInvalidFee: u64 = 7;

/// Price calculation overflow
const EPriceOverflow: u64 = 8;

// ====== Data Structures ======

/// Shared marketplace object containing all listings
public struct Marketplace has key {
    id: UID,
    /// Table of listings indexed by storage object ID
    listings: Table<ID, ListedStorage>,
    /// Marketplace fee in basis points (100 = 1%, 10000 = 100%)
    fee_bps: u64,
    /// Collected marketplace fees
    fees_collected: Balance<WAL>,
}

/// Listed storage item with pricing information
public struct ListedStorage has store {
    /// The storage resource being sold
    storage: Storage,
    /// Seller address
    seller: address,
    /// Price per byte per epoch (scaled by PRECISION_SCALE)
    price_per_size_per_epoch: u64,
}

/// Admin capability for marketplace management
public struct MarketplaceAdminCap has key, store {
    id: UID,
}

// ====== Events ======

/// Emitted when storage is listed
public struct StorageListed has copy, drop {
    storage_id: ID,
    seller: address,
    price_per_size_per_epoch: u64,
    size: u64,
    start_epoch: u32,
    end_epoch: u32,
    total_price: u64,
}

/// Emitted when storage is delisted
public struct StorageDelisted has copy, drop {
    storage_id: ID,
    seller: address,
}

/// Emitted when storage is purchased
public struct StoragePurchased has copy, drop {
    storage_id: ID,
    buyer: address,
    seller: address,
    amount_paid: u64,
    purchase_type: String, // "full", "partial_epoch", or "partial_size"
    purchased_size: u64,
    purchased_start_epoch: u32,
    purchased_end_epoch: u32,
}

// ====== Initialization ======

/// Initialize the marketplace as a shared object
fun init(ctx: &mut TxContext) {
    // Create marketplace with 0% initial fee
    let marketplace = Marketplace {
        id: object::new(ctx),
        listings: table::new<ID, ListedStorage>(ctx),
        fee_bps: 0,
        fees_collected: balance::zero<WAL>(),
    };

    // Share the marketplace
    transfer::share_object(marketplace);

    // Create and transfer admin capability
    let admin_cap = MarketplaceAdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
}

// ====== Admin Functions ======

/// Update marketplace fee (only admin with capability)
public fun update_marketplace_fee(
    _cap: &MarketplaceAdminCap,
    marketplace: &mut Marketplace,
    new_fee_bps: u64,
) {
    assert!(new_fee_bps <= MAX_FEE_BPS, EInvalidFee);
    marketplace.fee_bps = new_fee_bps;
}

/// Withdraw collected fees (only admin with capability)
public fun withdraw_fees(
    _cap: &MarketplaceAdminCap,
    marketplace: &mut Marketplace,
    ctx: &mut TxContext,
) {
    let amount = balance::value(&marketplace.fees_collected);
    if (amount > 0) {
        let fees = coin::take(&mut marketplace.fees_collected, amount, ctx);
        transfer::public_transfer(fees, ctx.sender());
    };
}

// ====== Helper Functions ======

/// Calculate price per size per epoch with high precision
public fun calculate_price_per_size_per_epoch_scaled(
    price: u64,
    size: u64,
    start_epoch: u32,
    end_epoch: u32,
): u64 {
    let duration = (end_epoch - start_epoch) as u64;
    assert!(duration > 0, EInvalidDuration);

    // Scale up before dividing to preserve precision
    // Use u128 to avoid overflow during multiplication
    let scaled_price = (price as u128) * (PRECISION_SCALE as u128);
    let result = scaled_price / (size as u128) / (duration as u128);

    assert!(result <= (0xFFFFFFFFFFFFFFFF as u128), EPriceOverflow);
    (result as u64)
}

/// Calculate total price from price per size per epoch
public fun calculate_total_price(
    price_per_size_per_epoch: u64,
    size: u64,
    start_epoch: u32,
    end_epoch: u32,
): u64 {
    let duration = (end_epoch - start_epoch) as u64;
    assert!(duration > 0, EInvalidDuration);

    // Calculate: (price_per_size_per_epoch * size * duration) / PRECISION_SCALE
    let result = (price_per_size_per_epoch as u128) * (size as u128) * (duration as u128)
                 / (PRECISION_SCALE as u128);

    assert!(result <= (0xFFFFFFFFFFFFFFFF as u128), EPriceOverflow);
    (result as u64)
}

/// Calculate marketplace fee amount
fun calculate_fee(amount: u64, fee_bps: u64): u64 {
    ((amount as u128) * (fee_bps as u128) / (MAX_FEE_BPS as u128)) as u64
}

// ====== Marketplace Operations ======

/// List storage for sale
public fun list_storage(
    marketplace: &mut Marketplace,
    storage: Storage,
    total_price: u64,
    ctx: &mut TxContext,
) {
    let seller = ctx.sender();
    let storage_id = object::id(&storage);

    // Get storage parameters
    let size = storage::size(&storage);
    let start_epoch = storage::start_epoch(&storage);
    let end_epoch = storage::end_epoch(&storage);

    // Calculate price per size per epoch
    let price_per_size_per_epoch = calculate_price_per_size_per_epoch_scaled(
        total_price,
        size,
        start_epoch,
        end_epoch,
    );

    // Create listing
    let listing = ListedStorage {
        storage,
        seller,
        price_per_size_per_epoch,
    };

    // Add to marketplace
    table::add(&mut marketplace.listings, storage_id, listing);

    // Emit event
    event::emit(StorageListed {
        storage_id,
        seller,
        price_per_size_per_epoch,
        size,
        start_epoch,
        end_epoch,
        total_price,
    });
}

/// Buy full storage listing
public fun buy_full_storage(
    marketplace: &mut Marketplace,
    storage_id: ID,
    mut payment: Coin<WAL>,
    ctx: &mut TxContext,
): Storage {
    let buyer = ctx.sender();

    // Verify listing exists
    assert!(table::contains(&marketplace.listings, storage_id), EStorageNotFound);

    // Remove listing
    let ListedStorage { storage, seller, price_per_size_per_epoch } =
        table::remove(&mut marketplace.listings, storage_id);

    // Get storage parameters
    let size = storage::size(&storage);
    let start_epoch = storage::start_epoch(&storage);
    let end_epoch = storage::end_epoch(&storage);

    // Calculate total price
    let total_price = calculate_total_price(
        price_per_size_per_epoch,
        size,
        start_epoch,
        end_epoch,
    );

    // Verify payment
    let payment_amount = coin::value(&payment);
    assert!(payment_amount >= total_price, EInsufficientPayment);

    // Calculate and collect marketplace fee
    let fee_amount = calculate_fee(total_price, marketplace.fee_bps);
    let seller_amount = total_price - fee_amount;

    if (fee_amount > 0) {
        let fee_coin = coin::split(&mut payment, fee_amount, ctx);
        coin::put(&mut marketplace.fees_collected, fee_coin);
    };

    // Pay seller
    if (seller_amount > 0) {
        let seller_payment = coin::split(&mut payment, seller_amount, ctx);
        transfer::public_transfer(seller_payment, seller);
    };

    // Return any excess payment to buyer
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, buyer);
    } else {
        coin::destroy_zero(payment);
    };

    // Emit event
    event::emit(StoragePurchased {
        storage_id,
        buyer,
        seller,
        amount_paid: total_price,
        purchase_type: string::utf8(b"full"),
        purchased_size: size,
        purchased_start_epoch: start_epoch,
        purchased_end_epoch: end_epoch,
    });

    storage
}

/// Buy partial storage by epoch range
public fun buy_partial_storage_epoch(
    marketplace: &mut Marketplace,
    storage_id: ID,
    purchase_start_epoch: u32,
    purchase_end_epoch: u32,
    mut payment: Coin<WAL>,
    ctx: &mut TxContext,
): Storage {
    let buyer = ctx.sender();

    // Verify listing exists
    assert!(table::contains(&marketplace.listings, storage_id), EStorageNotFound);

    // Borrow mutable listing
    let listing = table::borrow_mut(&mut marketplace.listings, storage_id);

    // Get storage parameters
    let size = storage::size(&listing.storage);
    let storage_start = storage::start_epoch(&listing.storage);
    let storage_end = storage::end_epoch(&listing.storage);

    // Validate epoch range
    assert!(purchase_start_epoch >= storage_start && purchase_end_epoch <= storage_end, EInvalidSplitEpoch);
    assert!(purchase_start_epoch < purchase_end_epoch, EInvalidDuration);

    // Calculate price for requested epochs
    let total_price = calculate_total_price(
        listing.price_per_size_per_epoch,
        size,
        purchase_start_epoch,
        purchase_end_epoch,
    );

    // Verify payment
    let payment_amount = coin::value(&payment);
    assert!(payment_amount >= total_price, EInsufficientPayment);

    // Split storage by epoch
    let purchased_storage = if (purchase_start_epoch > storage_start) {
        // Need to split at start
        let mut after_start = storage::split_by_epoch(&mut listing.storage, purchase_start_epoch, ctx);

        if (purchase_end_epoch < storage_end) {
            // Also need to split at end
            // The remainder after purchase_end_epoch needs to be fused back with listing.storage
            let remainder = storage::split_by_epoch(&mut after_start, purchase_end_epoch, ctx);
            // Fuse the remainder back with the original listing storage (which is before purchase_start)
            storage::fuse_periods(&mut listing.storage, remainder);
            after_start
        } else {
            after_start
        }
    } else if (purchase_end_epoch < storage_end) {
        // Only need to split at end
        storage::split_by_epoch(&mut listing.storage, purchase_end_epoch, ctx)
    } else {
        // This would be buying the full range - should use buy_full_storage instead
        // But we allow it here for flexibility
        let full_storage_id = object::id(&listing.storage);
        let ListedStorage { storage: full_storage, seller, price_per_size_per_epoch: _ } =
            table::remove(&mut marketplace.listings, storage_id);

        // Calculate and collect marketplace fee
        let fee_amount = calculate_fee(total_price, marketplace.fee_bps);
        let seller_amount = total_price - fee_amount;

        if (fee_amount > 0) {
            let fee_coin = coin::split(&mut payment, fee_amount, ctx);
            coin::put(&mut marketplace.fees_collected, fee_coin);
        };

        // Pay seller
        if (seller_amount > 0) {
            let seller_payment = coin::split(&mut payment, seller_amount, ctx);
            transfer::public_transfer(seller_payment, seller);
        };

        // Return any excess payment to buyer
        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, buyer);
        } else {
            coin::destroy_zero(payment);
        };

        // Emit event
        event::emit(StoragePurchased {
            storage_id: full_storage_id,
            buyer,
            seller,
            amount_paid: total_price,
            purchase_type: string::utf8(b"partial_epoch"),
            purchased_size: size,
            purchased_start_epoch: purchase_start_epoch,
            purchased_end_epoch: purchase_end_epoch,
        });

        return full_storage
    };

    let seller = listing.seller;

    // Calculate and collect marketplace fee
    let fee_amount = calculate_fee(total_price, marketplace.fee_bps);
    let seller_amount = total_price - fee_amount;

    if (fee_amount > 0) {
        let fee_coin = coin::split(&mut payment, fee_amount, ctx);
        coin::put(&mut marketplace.fees_collected, fee_coin);
    };

    // Pay seller
    if (seller_amount > 0) {
        let seller_payment = coin::split(&mut payment, seller_amount, ctx);
        transfer::public_transfer(seller_payment, seller);
    };

    // Return any excess payment to buyer
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, buyer);
    } else {
        coin::destroy_zero(payment);
    };

    // Emit event
    event::emit(StoragePurchased {
        storage_id,
        buyer,
        seller,
        amount_paid: total_price,
        purchase_type: string::utf8(b"partial_epoch"),
        purchased_size: size,
        purchased_start_epoch: purchase_start_epoch,
        purchased_end_epoch: purchase_end_epoch,
    });

    purchased_storage
}

/// Buy partial storage by size
public fun buy_partial_storage_size(
    marketplace: &mut Marketplace,
    storage_id: ID,
    purchase_size: u64,
    mut payment: Coin<WAL>,
    ctx: &mut TxContext,
): Storage {
    let buyer = ctx.sender();

    // Verify listing exists
    assert!(table::contains(&marketplace.listings, storage_id), EStorageNotFound);

    // Borrow mutable listing
    let listing = table::borrow_mut(&mut marketplace.listings, storage_id);

    // Get storage parameters
    let total_size = storage::size(&listing.storage);
    let start_epoch = storage::start_epoch(&listing.storage);
    let end_epoch = storage::end_epoch(&listing.storage);

    // Validate size
    assert!(purchase_size < total_size, EInvalidSplitSize);
    assert!(purchase_size > 0, EInvalidSplitSize);

    // Calculate price for requested size
    let total_price = calculate_total_price(
        listing.price_per_size_per_epoch,
        purchase_size,
        start_epoch,
        end_epoch,
    );

    // Verify payment
    let payment_amount = coin::value(&payment);
    assert!(payment_amount >= total_price, EInsufficientPayment);

    // Split storage by size
    let purchased_storage = storage::split_by_size(&mut listing.storage, purchase_size, ctx);

    let seller = listing.seller;

    // Calculate and collect marketplace fee
    let fee_amount = calculate_fee(total_price, marketplace.fee_bps);
    let seller_amount = total_price - fee_amount;

    if (fee_amount > 0) {
        let fee_coin = coin::split(&mut payment, fee_amount, ctx);
        coin::put(&mut marketplace.fees_collected, fee_coin);
    };

    // Pay seller
    if (seller_amount > 0) {
        let seller_payment = coin::split(&mut payment, seller_amount, ctx);
        transfer::public_transfer(seller_payment, seller);
    };

    // Return any excess payment to buyer
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, buyer);
    } else {
        coin::destroy_zero(payment);
    };

    // Emit event
    event::emit(StoragePurchased {
        storage_id,
        buyer,
        seller,
        amount_paid: total_price,
        purchase_type: string::utf8(b"partial_size"),
        purchased_size: purchase_size,
        purchased_start_epoch: start_epoch,
        purchased_end_epoch: end_epoch,
    });

    purchased_storage
}

/// Delist storage (seller only)
public fun delist_storage(
    marketplace: &mut Marketplace,
    storage_id: ID,
    ctx: &mut TxContext,
): Storage {
    let seller = ctx.sender();

    // Verify listing exists
    assert!(table::contains(&marketplace.listings, storage_id), EStorageNotFound);

    // Remove listing
    let ListedStorage { storage, seller: listing_seller, price_per_size_per_epoch: _ } =
        table::remove(&mut marketplace.listings, storage_id);

    // Verify caller is the seller
    assert!(seller == listing_seller, EUnauthorized);

    // Emit event
    event::emit(StorageDelisted {
        storage_id,
        seller,
    });

    storage
}

// ====== View Functions ======

/// Get listing details
public fun get_listing_price(
    marketplace: &Marketplace,
    storage_id: ID,
): (u64, u64, u32, u32, u64) {
    assert!(table::contains(&marketplace.listings, storage_id), EStorageNotFound);

    let listing = table::borrow(&marketplace.listings, storage_id);
    let size = storage::size(&listing.storage);
    let start_epoch = storage::start_epoch(&listing.storage);
    let end_epoch = storage::end_epoch(&listing.storage);
    let total_price = calculate_total_price(
        listing.price_per_size_per_epoch,
        size,
        start_epoch,
        end_epoch,
    );

    (listing.price_per_size_per_epoch, size, start_epoch, end_epoch, total_price)
}

/// Get marketplace fee
public fun get_marketplace_fee(marketplace: &Marketplace): u64 {
    marketplace.fee_bps
}

/// Get total listings count
public fun get_listings_count(marketplace: &Marketplace): u64 {
    table::length(&marketplace.listings)
}
