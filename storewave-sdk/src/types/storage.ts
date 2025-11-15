/**
 * Storage-related type definitions
 */

/**
 * Size units supported for input
 */
export type SizeUnit = 'bytes' | 'KiB' | 'MiB' | 'GiB' | 'TiB';

/**
 * Walrus storage resource object
 */
export interface WalrusStorage {
  /** Object ID of the storage resource */
  objectId: string;

  /** Size of the storage in bytes */
  storageSize: bigint;

  /** Starting epoch for the storage period */
  startEpoch: number;

  /** Ending epoch for the storage period */
  endEpoch: number;
}

/**
 * Walrus blob object
 */
export interface WalrusBlob {
  /** Object ID of the blob */
  objectId: string;

  /** Blob ID (content hash) */
  blobId: string;

  /** Size of the blob in bytes */
  size: bigint;

  /** Encoding type used */
  encodingType: number;

  /** Epoch when blob was registered */
  registeredEpoch: number;

  /** Epoch when blob was certified (null if not yet certified) */
  certifiedEpoch: number | null;

  /** Whether the blob can be deleted */
  deletable: boolean;

  /** Storage resource associated with this blob */
  storage: {
    objectId: string;
    startEpoch: number;
    endEpoch: number;
    storageSize: bigint;
  };
}

/**
 * Listed storage on the marketplace
 */
export interface ListedStorage {
  /** Database ID (UUID) */
  id: string;

  /** Object ID of the storage being sold */
  storageId: string;

  /** Address of the seller */
  seller: string;

  /** Price per size per epoch in FROST */
  pricePerSizePerEpoch: string;

  /** Size of the storage in bytes (as string for JSON compatibility) */
  size: string;

  /** Starting epoch for the storage period */
  startEpoch: number;

  /** Ending epoch for the storage period */
  endEpoch: number;

  /** Total price in FROST (smallest WAL unit, as string for JSON compatibility) */
  totalPrice: string;

  /** When the storage was listed */
  listedAt: Date;

  /** Last time the listing was updated */
  lastUpdatedAt: Date;

  /** Transaction digest of the last update */
  lastTxDigest: string;

  /** Event sequence number of the last update */
  lastEventSeq: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];

  /** Cursor for next page (null if no more pages) */
  nextCursor: string | null;

  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Paginated storage objects
 */
export type PaginatedStorage = PaginatedResponse<WalrusStorage>;

/**
 * Paginated blob objects
 */
export type PaginatedBlobs = PaginatedResponse<WalrusBlob>;

/**
 * Paginated listings
 */
export type PaginatedListings = PaginatedResponse<ListedStorage>;
