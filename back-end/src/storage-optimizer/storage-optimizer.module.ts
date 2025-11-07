import { Module } from '@nestjs/common';
import { StorageOptimizerService } from './storage-optimizer.service';
import { StorageOptimizerController } from './storage-optimizer.controller';
import { SuiIndexerModule } from '../sui-indexer/sui-indexer.module';
import { WalrusModule } from '../walrus/walrus.module';

@Module({
  imports: [SuiIndexerModule, WalrusModule],
  providers: [StorageOptimizerService],
  controllers: [StorageOptimizerController],
  exports: [StorageOptimizerService],
})
export class StorageOptimizerModule {}
