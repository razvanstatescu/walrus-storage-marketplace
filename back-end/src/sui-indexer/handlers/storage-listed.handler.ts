import { Injectable, Logger } from '@nestjs/common';
import { SuiEvent } from '@mysten/sui/client';
import { DatabaseOperationsService } from '../services/database-operations.service';
import {
  StorageListedDto,
  StorageListedUpsertData,
} from '../types/marketplace-events.types';

@Injectable()
export class StorageListedHandler {
  private readonly logger = new Logger(StorageListedHandler.name);

  constructor(private readonly dbOps: DatabaseOperationsService) {}

  /**
   * Handle StorageListed event
   */
  async handle(event: SuiEvent): Promise<void> {
    try {
      const parsedContent = event.parsedJson as StorageListedDto;

      // Validate event structure
      if (!parsedContent || !parsedContent.storage_id) {
        this.logger.error('Invalid StorageListed event structure', event);
        throw new Error('Invalid StorageListed event structure');
      }

      // Convert DTO to database insert data
      const data: StorageListedUpsertData = {
        storageId: parsedContent.storage_id,
        seller: parsedContent.seller,
        size: BigInt(parsedContent.size),
        startEpoch: parsedContent.start_epoch,
        endEpoch: parsedContent.end_epoch,
        totalPrice: BigInt(parsedContent.total_price),
        txDigest: event.id.txDigest,
        eventSeq: event.id.eventSeq,
        blockTime: event.timestampMs ? new Date(Number(event.timestampMs)) : undefined,
      };

      // Process the event
      await this.dbOps.processStorageListed(data);

      this.logger.debug(
        `✅ StorageListed handled: ${data.storageId} by ${data.seller}`,
      );
    } catch (error) {
      this.logger.error('Error handling StorageListed event:', error);
      throw error;
    }
  }
}
