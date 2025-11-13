import { Injectable, Logger } from '@nestjs/common';
import { SuiEvent } from '@mysten/sui/client';
import { DatabaseOperationsService } from '../services/database-operations.service';
import {
  StorageDelistedDto,
  StorageDelistedInsertData,
} from '../types/marketplace-events.types';

@Injectable()
export class StorageDelistedHandler {
  private readonly logger = new Logger(StorageDelistedHandler.name);

  constructor(private readonly dbOps: DatabaseOperationsService) {}

  /**
   * Handle StorageDelisted event
   */
  async handle(event: SuiEvent): Promise<void> {
    try {
      const parsedContent = event.parsedJson as StorageDelistedDto;

      // Validate event structure
      if (!parsedContent || !parsedContent.storage_id) {
        this.logger.error('Invalid StorageDelisted event structure', event);
        throw new Error('Invalid StorageDelisted event structure');
      }

      // Convert DTO to database insert data
      const data: StorageDelistedInsertData = {
        storageId: parsedContent.storage_id,
        seller: parsedContent.seller,
        txDigest: event.id.txDigest,
        eventSeq: event.id.eventSeq,
        blockTime: event.timestampMs
          ? new Date(Number(event.timestampMs))
          : undefined,
      };

      // Process the event
      await this.dbOps.processStorageDelisted(data);

      this.logger.debug(
        `✅ StorageDelisted handled: ${data.storageId} by ${data.seller}`,
      );
    } catch (error) {
      this.logger.error('Error handling StorageDelisted event:', error);
      throw error;
    }
  }
}
