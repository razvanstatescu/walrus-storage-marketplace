import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class OptimizeStorageDto {
  @IsString()
  @IsNotEmpty()
  size: string; // bigint as string (in bytes)

  @IsNumber()
  @Min(0)
  startEpoch: number;

  @IsNumber()
  @Min(0)
  endEpoch: number;
}
