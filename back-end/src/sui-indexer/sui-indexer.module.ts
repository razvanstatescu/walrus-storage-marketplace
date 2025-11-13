import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SuiClientModule } from './sui-client/sui-client.module';
import suiIndexerConfig from '../config/sui-indexer.config';

// Services
import { SuiIndexerService } from './sui-indexer.service';
import { EventRegistryService } from './registry/event-registry.service';
import { CursorService } from './cursor/cursor.service';
import { ProcessingLockService } from './services/processing-lock.service';
import { DatabaseOperationsService } from './services/database-operations.service';

// Handlers
import { StorageListedHandler } from './handlers/storage-listed.handler';
import { StoragePurchasedHandler } from './handlers/storage-purchased.handler';
import { StorageDelistedHandler } from './handlers/storage-delisted.handler';

// Gateway & Controller
import { EventsGateway } from './gateway/events.gateway';
import { IndexerController } from './controllers/indexer.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forFeature(suiIndexerConfig),
    PrismaModule,
    SuiClientModule,
  ],
  providers: [
    // Core services
    SuiIndexerService,
    EventRegistryService,
    CursorService,
    ProcessingLockService,
    DatabaseOperationsService,

    // Event handlers
    StorageListedHandler,
    StoragePurchasedHandler,
    StorageDelistedHandler,

    // WebSocket gateway
    EventsGateway,
  ],
  controllers: [IndexerController],
  exports: [SuiIndexerService, DatabaseOperationsService, EventsGateway],
})
export class SuiIndexerModule {}
