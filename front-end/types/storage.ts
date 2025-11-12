export interface WalrusStorage {
  objectId: string;
  storageSize: bigint;
  startEpoch: number;
  endEpoch: number;
}

export interface WalrusBlob {
  objectId: string;
  blobId: string;
  size: bigint;
  encodingType: number;
  registeredEpoch: number;
  certifiedEpoch: number | null;
  deletable: boolean;
  storage: {
    objectId: string;
    startEpoch: number;
    endEpoch: number;
    storageSize: bigint;
  };
}

export interface StorageState {
  objects: WalrusStorage[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
}

export interface BlobState {
  objects: WalrusBlob[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
}

export interface WalletItem {
  id: string;
  objectId: string;
  size: string;
  startEpoch: number;
  endEpoch: number;
}

export interface StorageCostParams {
  size: number;
  epochs: number;
}

export interface StorageCostResult {
  storageCost: bigint;
}

export interface StorageCostState {
  result: StorageCostResult | null;
  isLoading: boolean;
  error: string | null;
}

export type ItemType = 'storage' | 'blobs';

export interface ListingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: WalrusStorage[] | WalrusBlob[];
  itemType: ItemType;
}

export interface PriceCalculation {
  totalUnits: number;
  userPricePerUnit: number;
  totalUserPrice: number;
  systemPricePerUnit: bigint | null;
  isLoadingSystemPrice: boolean;
}
