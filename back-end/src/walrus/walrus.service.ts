import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalrusClient } from '@mysten/walrus';
import { SuiClientService } from '../sui-indexer/sui-client/sui-client.service';
import { IWalrusService } from './types/walrus.types';

@Injectable()
export class WalrusService implements IWalrusService {
  private readonly logger = new Logger(WalrusService.name);
  private walrusClient: WalrusClient | null = null;

  constructor(
    private readonly suiClientService: SuiClientService,
    private readonly configService: ConfigService,
  ) {}

  private getWalrusClient(): WalrusClient {
    if (!this.walrusClient) {
      try {
        const network = this.configService.get<string>('suiIndexer.network');

        this.walrusClient = new WalrusClient({
          network: network === 'mainnet' ? 'mainnet' : 'testnet',
          suiClient: this.suiClientService.getClient(),
        });

        this.logger.log(`✅ Walrus client initialized for ${network}`);
      } catch (error) {
        this.logger.error(
          `Failed to initialize Walrus client: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          'Failed to initialize Walrus client',
        );
      }
    }
    return this.walrusClient;
  }

  /**
   * Calculate storage cost for blob storage
   * @param size Size of the blob in bytes
   * @param epochs Number of epochs to store the blob
   * @returns Storage cost result with storageCost in FROST (smallest unit)
   */
  async storageCost(
    size: number,
    epochs: number,
  ): Promise<{ storageCost: bigint }> {
    try {
      this.logger.debug(
        `Calculating storage cost for ${size} bytes, ${epochs} epochs`,
      );

      const walrusClient = this.getWalrusClient();
      const result = await walrusClient.storageCost(size, epochs);

      this.logger.debug(`Storage cost calculated: ${result.storageCost} FROST`);
      return { storageCost: result.storageCost };
    } catch (error) {
      this.logger.error(
        `Failed to calculate storage cost: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to calculate storage cost: ${error.message}`,
      );
    }
  }

  /**
   * Get Walrus system state including current epoch
   * @returns System state with current epoch information
   */
  async getSystemState(): Promise<{ epoch: bigint }> {
    try {
      this.logger.debug('Getting Walrus system state');

      const walrusClient = this.getWalrusClient();
      const systemState = await walrusClient.systemState();

      this.logger.debug(`Current Walrus epoch: ${systemState.committee.epoch}`);
      return { epoch: BigInt(systemState.committee.epoch) };
    } catch (error) {
      this.logger.error(
        `Failed to get Walrus system state: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to get Walrus system state: ${error.message}`,
      );
    }
  }
}
