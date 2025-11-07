import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { SuiClientService } from './sui-client/sui-client.service';
import { EventRegistryService } from './registry/event-registry.service';
import { CursorService, EventId } from './cursor/cursor.service';
import { ProcessingLockService } from './services/processing-lock.service';
import { StorageListedHandler } from './handlers/storage-listed.handler';
import { StoragePurchasedHandler } from './handlers/storage-purchased.handler';
import { StorageDelistedHandler } from './handlers/storage-delisted.handler';
import { SuiIndexerConfig } from '../config/sui-indexer.config';

@Injectable()
export class SuiIndexerService implements OnModuleInit {
  private readonly logger = new Logger(SuiIndexerService.name);
  private isIndexing = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly suiClient: SuiClientService,
    private readonly eventRegistry: EventRegistryService,
    private readonly cursorService: CursorService,
    private readonly lockService: ProcessingLockService,
    private readonly storageListedHandler: StorageListedHandler,
    private readonly storagePurchasedHandler: StoragePurchasedHandler,
    private readonly storageDelistedHandler: StorageDelistedHandler,
  ) {}

  async onModuleInit() {
    const config = this.configService.get<SuiIndexerConfig>('suiIndexer');

    if (!config?.enabled) {
      this.logger.log('⏸️  Sui Indexer disabled via config - skipping initialization');
      return;
    }

    this.logger.log('🚀 Sui Indexer initializing...');
    await this.registerEventHandlers();
    this.logger.log('✅ Sui Indexer ready');
  }

  /**
   * Register all event handlers
   */
  private async registerEventHandlers(): Promise<void> {
    const config = this.suiClient.getConfig();
    const packageId = config.packageId;

    // Register StorageListed handler
    this.eventRegistry.registerHandler(
      packageId,
      'marketplace',
      'StorageListed',
      (event) => this.storageListedHandler.handle(event),
    );

    // Register StoragePurchased handler
    this.eventRegistry.registerHandler(
      packageId,
      'marketplace',
      'StoragePurchased',
      (event) => this.storagePurchasedHandler.handle(event),
    );

    // Register StorageDelisted handler
    this.eventRegistry.registerHandler(
      packageId,
      'marketplace',
      'StorageDelisted',
      (event) => this.storageDelistedHandler.handle(event),
    );

    this.logger.log(
      `📝 Registered ${this.eventRegistry.getHandlerCount()} event handlers`,
    );
  }

  /**
   * Main polling loop - runs every 5 seconds
   */
  @Interval(5000)
  async pollEvents(): Promise<void> {
    const config = this.configService.get<SuiIndexerConfig>('suiIndexer');

    if (!config?.enabled) {
      // Silently skip when disabled - don't spam logs every 5 seconds
      return;
    }

    if (this.isIndexing) {
      this.logger.debug('Already indexing, skipping this interval');
      return;
    }

    this.isIndexing = true;

    try {
      const eventTypes = this.eventRegistry.getAllEventTypes();

      for (const eventType of eventTypes) {
        await this.processEventType(eventType);
      }
    } catch (error) {
      this.logger.error('Error in polling loop:', error);
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Process events for a specific event type
   */
  private async processEventType(eventType: string): Promise<void> {
    // Try to acquire lock
    if (!this.lockService.tryAcquireLock(eventType)) {
      this.logger.debug(`Skipping ${eventType} - already processing`);
      return;
    }

    try {
      const config = this.suiClient.getConfig();
      const client = this.suiClient.getClient();
      const handler = this.eventRegistry.getHandler(eventType);
      const fullEventType = this.eventRegistry.getFullEventType(eventType);

      if (!handler || !fullEventType) {
        this.logger.warn(`No handler or event type found for ${eventType}`);
        return;
      }

      // Get latest cursor
      const cursor = await this.cursorService.getLatestCursor(eventType);

      // Query events from Sui
      const response = await client.queryEvents({
        query: {
          MoveEventType: fullEventType,
        },
        cursor: cursor ? { txDigest: cursor.txDigest, eventSeq: cursor.eventSeq } : undefined,
        limit: config.batchSize,
        order: 'ascending',
      });

      // Skip if no new events
      if (!response.data || response.data.length === 0) {
        this.logger.debug(`No new events for ${eventType}`);
        return;
      }

      this.logger.log(
        `📦 Processing ${response.data.length} ${eventType} events`,
      );

      // Process events sequentially
      for (const event of response.data) {
        try {
          // Skip if we've already processed this event
          if (
            cursor &&
            event.id.txDigest === cursor.txDigest &&
            event.id.eventSeq === cursor.eventSeq
          ) {
            this.logger.debug(`Skipping already processed event: ${event.id.eventSeq}`);
            continue;
          }

          // Process the event
          await handler(event);

          // Update cursor after successful processing
          const newCursor: EventId = {
            txDigest: event.id.txDigest,
            eventSeq: event.id.eventSeq,
          };
          await this.cursorService.saveLatestCursor(eventType, newCursor);
        } catch (error) {
          this.logger.error(
            `Error processing event ${event.id.eventSeq} for ${eventType}:`,
            error,
          );
          // Stop processing this batch on error to maintain order
          throw error;
        }
      }

      this.logger.log(`✅ Processed ${response.data.length} ${eventType} events`);
    } catch (error) {
      this.logger.error(`Error processing ${eventType}:`, error);
      throw error;
    } finally {
      this.lockService.releaseLock(eventType);
    }
  }

  /**
   * Manually trigger indexing for a specific event type
   */
  async indexEventType(eventType: string): Promise<void> {
    this.logger.log(`Manual indexing triggered for ${eventType}`);
    await this.processEventType(eventType);
  }

  /**
   * Reindex an event type from genesis
   */
  async reindexEventType(eventType: string): Promise<void> {
    this.logger.warn(`Reindexing ${eventType} from genesis...`);
    await this.cursorService.deleteCursor(eventType);
    await this.processEventType(eventType);
    this.logger.log(`✅ Reindexing complete for ${eventType}`);
  }

  /**
   * Get indexer status
   */
  async getStatus() {
    const cursors = await this.cursorService.getAllCursors();
    const activeLocks = this.lockService.getActiveLocks();
    const eventTypes = this.eventRegistry.getAllEventTypes();

    return {
      isIndexing: this.isIndexing,
      eventTypes,
      cursors,
      activeLocks,
      handlerCount: this.eventRegistry.getHandlerCount(),
    };
  }

  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    try {
      const suiHealthy = await this.suiClient.isHealthy();
      return suiHealthy && this.eventRegistry.getHandlerCount() > 0;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}
