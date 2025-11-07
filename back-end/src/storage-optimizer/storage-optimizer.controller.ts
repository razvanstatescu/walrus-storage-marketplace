import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { StorageOptimizerService } from './storage-optimizer.service';
import { OptimizeStorageDto } from './dto/optimize-storage.dto';
import { OptimizationResultDto } from './dto/optimization-result.dto';

@Controller('storage-optimizer')
export class StorageOptimizerController {
  constructor(
    private readonly storageOptimizerService: StorageOptimizerService,
  ) {}

  /**
   * Optimize storage allocation
   * POST /storage-optimizer/optimize
   *
   * @param dto Request with size, startEpoch, endEpoch
   * @returns Optimization result with operations and total cost
   */
  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  async optimize(
    @Body() dto: OptimizeStorageDto,
  ): Promise<OptimizationResultDto> {
    try {
      // Convert string to bigint
      const size = BigInt(dto.size);

      // Validate epochs
      if (dto.endEpoch <= dto.startEpoch) {
        throw new HttpException(
          'End epoch must be greater than start epoch',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (size <= 0n) {
        throw new HttpException(
          'Size must be greater than 0',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.storageOptimizerService.optimizeStorage(
        size,
        dto.startEpoch,
        dto.endEpoch,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Optimization failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
