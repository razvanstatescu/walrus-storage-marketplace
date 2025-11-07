import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SuiIndexerModule } from './sui-indexer/sui-indexer.module';
import { WalrusModule } from './walrus/walrus.module';
import { StorageOptimizerModule } from './storage-optimizer/storage-optimizer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Conditionally import SuiIndexerModule based on environment variable
    ...(process.env.SUI_INDEXER_ENABLED === 'true' ? [SuiIndexerModule] : []),
    WalrusModule,
    StorageOptimizerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
