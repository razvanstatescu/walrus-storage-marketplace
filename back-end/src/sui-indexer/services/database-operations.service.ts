import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StorageListedUpsertData,
  StoragePurchasedInsertData,
  StorageDelistedInsertData,
} from '../types/marketplace-events.types';

@Injectable()
export class DatabaseOperationsService {
  private readonly logger = new Logger(DatabaseOperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process StorageListed event
   * - Upserts into listed_storage (current state)
   * - Inserts into storage_listed_history (append-only)
   */
  async processStorageListed(data: StorageListedUpsertData): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Upsert into current state table
        await tx.listedStorage.upsert({
          where: { storageId: data.storageId },
          update: {
            seller: data.seller,
            size: data.size,
            startEpoch: data.startEpoch,
            endEpoch: data.endEpoch,
            totalPrice: data.totalPrice,
            lastUpdatedAt: data.blockTime || new Date(),
            lastTxDigest: data.txDigest,
            lastEventSeq: data.eventSeq,
          },
          create: {
            storageId: data.storageId,
            seller: data.seller,
            size: data.size,
            startEpoch: data.startEpoch,
            endEpoch: data.endEpoch,
            totalPrice: data.totalPrice,
            listedAt: data.blockTime || new Date(),
            lastUpdatedAt: data.blockTime || new Date(),
            lastTxDigest: data.txDigest,
            lastEventSeq: data.eventSeq,
          },
        });

        // Insert into history table
        await tx.storageListedEvent.create({
          data: {
            storageId: data.storageId,
            seller: data.seller,
            size: data.size,
            startEpoch: data.startEpoch,
            endEpoch: data.endEpoch,
            totalPrice: data.totalPrice,
            txDigest: data.txDigest,
            eventSeq: data.eventSeq,
            blockTime: data.blockTime || new Date(),
          },
        });
      });

      this.logger.debug(`✅ Processed StorageListed: ${data.storageId}`);
    } catch (error) {
      this.logger.error(`Error processing StorageListed: ${data.storageId}`, error);
      throw error;
    }
  }

  /**
   * Process StoragePurchased event
   * - Updates listed_storage based on purchase_type
   *   - "full": deletes the listing
   *   - "partial_epoch": updates start_epoch
   *   - "partial_size": updates size and total_price
   * - Inserts into storage_purchased_history (append-only)
   */
  async processStoragePurchased(data: StoragePurchasedInsertData): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Insert into history table first
        await tx.storagePurchasedEvent.create({
          data: {
            storageId: data.storageId,
            buyer: data.buyer,
            seller: data.seller,
            amountPaid: data.amountPaid,
            purchaseType: data.purchaseType,
            purchasedSize: data.purchasedSize,
            purchasedStartEpoch: data.purchasedStartEpoch,
            purchasedEndEpoch: data.purchasedEndEpoch,
            txDigest: data.txDigest,
            eventSeq: data.eventSeq,
            blockTime: data.blockTime || new Date(),
          },
        });

        // Update current state based on purchase type
        if (data.purchaseType === 'full') {
          // Full purchase - remove listing
          await tx.listedStorage.delete({
            where: { storageId: data.storageId },
          });
          this.logger.debug(`Deleted full purchase: ${data.storageId}`);
        } else if (data.purchaseType === 'partial_epoch') {
          // Partial epoch purchase - update start epoch and pro-rate price
          const listing = await tx.listedStorage.findUnique({
            where: { storageId: data.storageId },
          });

          if (listing) {
            // Pro-rate based on remaining epochs
            const originalEpochs = BigInt(listing.endEpoch - listing.startEpoch);
            const remainingEpochs = BigInt(listing.endEpoch - data.purchasedEndEpoch);
            const newTotalPrice = (listing.totalPrice * remainingEpochs) / originalEpochs;

            await tx.listedStorage.update({
              where: { storageId: data.storageId },
              data: {
                startEpoch: data.purchasedEndEpoch,
                totalPrice: newTotalPrice,
                lastUpdatedAt: data.blockTime || new Date(),
                lastTxDigest: data.txDigest,
                lastEventSeq: data.eventSeq,
              },
            });
            this.logger.debug(`Updated partial_epoch purchase: ${data.storageId}`);
          }
        } else if (data.purchaseType === 'partial_size') {
          // Partial size purchase - update size and pro-rate price
          const listing = await tx.listedStorage.findUnique({
            where: { storageId: data.storageId },
          });

          if (listing) {
            // Pro-rate based on remaining size
            const newSize = listing.size - data.purchasedSize;
            const newTotalPrice = (listing.totalPrice * newSize) / listing.size;

            await tx.listedStorage.update({
              where: { storageId: data.storageId },
              data: {
                size: newSize,
                totalPrice: newTotalPrice,
                lastUpdatedAt: data.blockTime || new Date(),
                lastTxDigest: data.txDigest,
                lastEventSeq: data.eventSeq,
              },
            });
            this.logger.debug(`Updated partial_size purchase: ${data.storageId}`);
          }
        }
      });

      this.logger.debug(`✅ Processed StoragePurchased: ${data.storageId} (${data.purchaseType})`);
    } catch (error) {
      this.logger.error(`Error processing StoragePurchased: ${data.storageId}`, error);
      throw error;
    }
  }

  /**
   * Process StorageDelisted event
   * - Deletes from listed_storage
   * - Inserts into storage_delisted_history (append-only)
   */
  async processStorageDelisted(data: StorageDelistedInsertData): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete from current state
        await tx.listedStorage.delete({
          where: { storageId: data.storageId },
        });

        // Insert into history table
        await tx.storageDelistedEvent.create({
          data: {
            storageId: data.storageId,
            seller: data.seller,
            txDigest: data.txDigest,
            eventSeq: data.eventSeq,
            blockTime: data.blockTime || new Date(),
          },
        });
      });

      this.logger.debug(`✅ Processed StorageDelisted: ${data.storageId}`);
    } catch (error) {
      this.logger.error(`Error processing StorageDelisted: ${data.storageId}`, error);
      throw error;
    }
  }

  /**
   * Get current listed storage by ID
   */
  async getListedStorage(storageId: string) {
    return this.prisma.listedStorage.findUnique({
      where: { storageId },
    });
  }

  /**
   * Get all current listings
   */
  async getAllListedStorage() {
    return this.prisma.listedStorage.findMany({
      orderBy: { listedAt: 'desc' },
    });
  }

  /**
   * Get purchase history for a storage ID
   */
  async getPurchaseHistory(storageId: string) {
    return this.prisma.storagePurchasedEvent.findMany({
      where: { storageId },
      orderBy: { blockTime: 'desc' },
    });
  }

  /**
   * Get listing history for a storage ID
   */
  async getListingHistory(storageId: string) {
    return this.prisma.storageListedEvent.findMany({
      where: { storageId },
      orderBy: { blockTime: 'desc' },
    });
  }
}
