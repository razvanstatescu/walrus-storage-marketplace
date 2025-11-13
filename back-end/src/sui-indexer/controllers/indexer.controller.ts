import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SuiIndexerService } from '../sui-indexer.service';
import { DatabaseOperationsService } from '../services/database-operations.service';
import { EventsGateway } from '../gateway/events.gateway';

@Controller('indexer')
export class IndexerController {
  constructor(
    private readonly indexerService: SuiIndexerService,
    private readonly dbOps: DatabaseOperationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Get indexer status
   */
  @Get('status')
  async getStatus() {
    try {
      const status = await this.indexerService.getStatus();
      const wsStats = this.eventsGateway.getStats();
      const isHealthy = await this.indexerService.isHealthy();

      return {
        ...status,
        websocket: wsStats,
        healthy: isHealthy,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get indexer status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    const isHealthy = await this.indexerService.isHealthy();
    if (!isHealthy) {
      throw new HttpException(
        'Indexer unhealthy',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return { status: 'ok' };
  }

  /**
   * Manually trigger indexing for an event type
   */
  @Post('index/:eventType')
  async indexEventType(@Param('eventType') eventType: string) {
    try {
      await this.indexerService.indexEventType(eventType);
      return { success: true, message: `Indexing triggered for ${eventType}` };
    } catch (error) {
      throw new HttpException(
        `Failed to index ${eventType}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Reindex an event type from genesis
   */
  @Post('reindex/:eventType')
  async reindexEventType(@Param('eventType') eventType: string) {
    try {
      await this.indexerService.reindexEventType(eventType);
      return { success: true, message: `Reindexing complete for ${eventType}` };
    } catch (error) {
      throw new HttpException(
        `Failed to reindex ${eventType}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all current listings (optionally filtered by seller)
   */
  @Get('listings')
  async getAllListings(@Query('seller') seller?: string) {
    try {
      if (seller) {
        const listings = await this.dbOps.getListingsBySeller(seller);
        return listings;
      }
      const listings = await this.dbOps.getAllListedStorage();
      return listings;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch listings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a specific listing by storage ID
   */
  @Get('listings/:storageId')
  async getListing(@Param('storageId') storageId: string) {
    try {
      const listing = await this.dbOps.getListedStorage(storageId);
      if (!listing) {
        throw new HttpException('Listing not found', HttpStatus.NOT_FOUND);
      }
      return listing;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch listing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get purchase history for a storage ID
   */
  @Get('history/purchases/:storageId')
  async getPurchaseHistory(@Param('storageId') storageId: string) {
    try {
      const history = await this.dbOps.getPurchaseHistory(storageId);
      return history;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch purchase history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get listing history for a storage ID
   */
  @Get('history/listings/:storageId')
  async getListingHistory(@Param('storageId') storageId: string) {
    try {
      const history = await this.dbOps.getListingHistory(storageId);
      return history;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch listing history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get marketplace analytics (aggregated statistics)
   */
  @Get('analytics')
  async getMarketplaceAnalytics() {
    try {
      const analytics = await this.dbOps.getMarketplaceAnalytics();
      return analytics;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch marketplace analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
