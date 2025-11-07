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

export class OptimizationResultDto {
  operations: StorageOperationDto[];
  totalCost: string; // bigint as string (in FROST, smallest unit)
  systemOnlyPrice: string; // bigint as string - price if using all system storage
  allocations: AllocationDto[];
  needsNewReservation?: NewReservationDto;
}
