import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalrusService } from './walrus.service';
import { SuiClientModule } from '../sui-indexer/sui-client/sui-client.module';

@Module({
  imports: [ConfigModule, SuiClientModule],
  providers: [WalrusService],
  exports: [WalrusService],
})
export class WalrusModule {}
