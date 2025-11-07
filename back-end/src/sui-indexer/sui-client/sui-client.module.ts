import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SuiClientService } from './sui-client.service';
import suiIndexerConfig from '../../config/sui-indexer.config';

@Module({
  imports: [ConfigModule.forFeature(suiIndexerConfig)],
  providers: [SuiClientService],
  exports: [SuiClientService],
})
export class SuiClientModule {}
