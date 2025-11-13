/**
 * Marketplace Event DTOs - Match Sui Move event structures
 */

export interface StorageListedDto {
  storage_id: string;
  seller: string;
  price_per_size_per_epoch: string;
  size: string;
  start_epoch: number;
  end_epoch: number;
  total_price: string;
}

export interface StoragePurchasedDto {
  storage_id: string;
  buyer: string;
  seller: string;
  amount_paid: string;
  purchase_type: string; // "full", "partial_epoch", or "partial_size"
  purchased_size: string;
  purchased_start_epoch: number;
  purchased_end_epoch: number;
}

export interface StorageDelistedDto {
  storage_id: string;
  seller: string;
}

/**
 * Database insert/update types
 */

export interface StorageListedUpsertData {
  storageId: string;
  seller: string;
  pricePerSizePerEpoch: bigint;
  size: bigint;
  startEpoch: number;
  endEpoch: number;
  totalPrice: bigint;
  txDigest: string;
  eventSeq: string;
  blockTime?: Date;
}

export interface StoragePurchasedInsertData {
  storageId: string;
  buyer: string;
  seller: string;
  amountPaid: bigint;
  purchaseType: string;
  purchasedSize: bigint;
  purchasedStartEpoch: number;
  purchasedEndEpoch: number;
  txDigest: string;
  eventSeq: string;
  blockTime?: Date;
}

export interface StorageDelistedInsertData {
  storageId: string;
  seller: string;
  txDigest: string;
  eventSeq: string;
  blockTime?: Date;
}
