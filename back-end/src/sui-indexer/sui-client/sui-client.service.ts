import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SuiClient } from '@mysten/sui/client';
import { SuiIndexerConfig } from '../../config/sui-indexer.config';

@Injectable()
export class SuiClientService implements OnModuleInit {
  private readonly logger = new Logger(SuiClientService.name);
  private client: SuiClient;
  private config: SuiIndexerConfig;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<SuiIndexerConfig>('suiIndexer')!;
  }

  async onModuleInit() {
    try {
      this.client = new SuiClient({
        url:
          this.config.rpcUrl ||
          `https://fullnode.${this.config.network}.sui.io:443`,
      });

      // Test connection
      const chainId = await this.client.getChainIdentifier();
      this.logger.log(
        `✅ Connected to Sui ${this.config.network} (Chain ID: ${chainId})`,
      );
      this.logger.log(`📦 Monitoring Package: ${this.config.packageId}`);
    } catch (error) {
      this.logger.error('❌ Failed to connect to Sui RPC:', error);
      throw error;
    }
  }

  getClient(): SuiClient {
    if (!this.client) {
      throw new Error('Sui client not initialized');
    }
    return this.client;
  }

  getConfig(): SuiIndexerConfig {
    return this.config;
  }

  /**
   * Health check for Sui connection
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.getChainIdentifier();
      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}
