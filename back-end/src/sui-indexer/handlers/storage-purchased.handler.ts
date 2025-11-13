import { Injectable, Logger } from '@nestjs/common';
import { SuiEvent } from '@mysten/sui/client';
import { DatabaseOperationsService } from '../services/database-operations.service';
import {
  StoragePurchasedDto,
  StoragePurchasedInsertData,
} from '../types/marketplace-events.types';

@Injectable()
export class StoragePurchasedHandler {
  private readonly logger = new Logger(StoragePurchasedHandler.name);

  constructor(private readonly dbOps: DatabaseOperationsService) {}

  /**
   * Handle StoragePurchased event
   */
  async handle(event: SuiEvent): Promise<void> {
    try {
      const parsedContent = event.parsedJson as StoragePurchasedDto;

      // Validate event structure
      if (!parsedContent || !parsedContent.storage_id) {
        this.logger.error('Invalid StoragePurchased event structure', event);
        throw new Error('Invalid StoragePurchased event structure');
      }

      // Convert DTO to database insert data
      const data: StoragePurchasedInsertData = {
        storageId: parsedContent.storage_id,
        buyer: parsedContent.buyer,
        seller: parsedContent.seller,
        amountPaid: BigInt(parsedContent.amount_paid),
        purchaseType: parsedContent.purchase_type,
        purchasedSize: BigInt(parsedContent.purchased_size),
        purchasedStartEpoch: parsedContent.purchased_start_epoch,
        purchasedEndEpoch: parsedContent.purchased_end_epoch,
        txDigest: event.id.txDigest,
        eventSeq: event.id.eventSeq,
        blockTime: event.timestampMs
          ? new Date(Number(event.timestampMs))
          : undefined,
      };

      // Process the event
      await this.dbOps.processStoragePurchased(data);

      this.logger.debug(
        `✅ StoragePurchased handled: ${data.storageId} (${data.purchaseType}) by ${data.buyer}`,
      );
    } catch (error) {
      this.logger.error('Error handling StoragePurchased event:', error);
      throw error;
    }
  }
}
