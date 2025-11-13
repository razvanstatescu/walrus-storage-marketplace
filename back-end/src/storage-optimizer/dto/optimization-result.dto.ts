export class StorageOperationDto {
  type: string;
  description: string;
  storageObjectId?: string;
  splitSize?: string; // bigint as string
  splitStartEpoch?: number;
  splitEndEpoch?: number;
  splitEpoch?: number;
  reserveSize?: string; // bigint as string
  startEpoch?: number;
  endEpoch?: number;
  cost?: string; // bigint as string
}

export class AllocationDto {
  storageObjectId: string;
  usedSize: string; // bigint as string
  usedStartEpoch: number;
  usedEndEpoch: number;
  cost: string; // bigint as string
  sellerPayment: string; // bigint as string
  seller?: string;
}

export class NewReservationDto {
  size: string; // bigint as string
  epochs: number;
  cost: string; // bigint as string
}

export class ExecutionFlowDto {
  operationIndex: number;
  type: string;
  producesStorage: boolean;
  storageRef?: string; // Variable name like "storage_0", "storage_1"
  paymentIndex?: number; // Index into paymentAmounts array (for buy/reserve operations)
  sellerAddress?: string; // For marketplace purchases
  inputStorageFromOperation?: number; // For split operations - which operation produced the input
  fuseTargets?: {
    first: number; // Operation index producing first storage (modified in-place)
    second: number; // Operation index producing second storage (consumed)
  };
}

export class PTBMetadataDto {
  paymentAmounts: string[]; // Array of WAL amounts in MIST - allows single split operation
  executionFlow: ExecutionFlowDto[];
}

export class OptimizationResultDto {
  operations: StorageOperationDto[];
  totalCost: string; // bigint as string (in FROST, smallest unit)
  systemOnlyPrice: string; // bigint as string - price if using all system storage
  allocations: AllocationDto[];
  needsNewReservation?: NewReservationDto;
  ptbMetadata: PTBMetadataDto; // Metadata for constructing Programmable Transaction Blocks
}
