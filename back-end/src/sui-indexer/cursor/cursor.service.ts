import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface EventId {
  eventSeq: string;
  txDigest: string;
}

@Injectable()
export class CursorService {
  private readonly logger = new Logger(CursorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the latest cursor for an event type
   * @param eventType Format: "marketplace::EventName"
   * @returns EventId cursor or null if not found
   */
  async getLatestCursor(eventType: string): Promise<EventId | null> {
    try {
      const cursor = await this.prisma.eventCursor.findUnique({
        where: { id: eventType },
      });

      if (!cursor) {
        this.logger.debug(`No cursor found for ${eventType}, starting from genesis`);
        return null;
      }

      return {
        eventSeq: cursor.eventSeq,
        txDigest: cursor.txDigest,
      };
    } catch (error) {
      this.logger.error(`Error fetching cursor for ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Save the latest cursor for an event type
   * @param eventType Format: "marketplace::EventName"
   * @param cursor EventId with eventSeq and txDigest
   */
  async saveLatestCursor(eventType: string, cursor: EventId): Promise<void> {
    try {
      await this.prisma.eventCursor.upsert({
        where: { id: eventType },
        update: {
          eventSeq: cursor.eventSeq,
          txDigest: cursor.txDigest,
        },
        create: {
          id: eventType,
          eventSeq: cursor.eventSeq,
          txDigest: cursor.txDigest,
        },
      });

      this.logger.debug(`Cursor saved for ${eventType}: ${cursor.eventSeq}`);
    } catch (error) {
      this.logger.error(`Error saving cursor for ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Delete cursor for an event type (for reindexing)
   */
  async deleteCursor(eventType: string): Promise<void> {
    try {
      await this.prisma.eventCursor.delete({
        where: { id: eventType },
      });
      this.logger.log(`Cursor deleted for ${eventType}`);
    } catch (error) {
      if (error.code !== 'P2025') {
        // P2025 = Record not found
        this.logger.error(`Error deleting cursor for ${eventType}:`, error);
        throw error;
      }
    }
  }

  /**
   * Get all cursors
   */
  async getAllCursors(): Promise<Record<string, EventId>> {
    const cursors = await this.prisma.eventCursor.findMany();
    const result: Record<string, EventId> = {};

    for (const cursor of cursors) {
      result[cursor.id] = {
        eventSeq: cursor.eventSeq,
        txDigest: cursor.txDigest,
      };
    }

    return result;
  }
}
