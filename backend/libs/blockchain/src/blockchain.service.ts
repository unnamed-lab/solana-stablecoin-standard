import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicKey } from '@solana/web3.js';
import { ConnectionFactory } from './connection.factory';

/**
 * Wraps the SSS SDK for use within the NestJS DI system.
 *
 * Provides lazy-loaded access to on-chain token info (supply, config)
 * without requiring the full SDK import at module level.
 */
@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly connectionFactory: ConnectionFactory,
  ) {}

  /**
   * Get the current total supply directly from the on-chain mint account.
   */
  async getTotalSupply(): Promise<{ totalSupply: string; decimals: number }> {
    const connection = this.connectionFactory.getConnection();
    const mintAddress = new PublicKey(
      this.configService.get<string>('MINT_ADDRESS', ''),
    );

    const mintInfo = await connection.getParsedAccountInfo(mintAddress);
    if (!mintInfo.value) {
      throw new Error(`Mint account not found: ${mintAddress.toBase58()}`);
    }

    const data = (mintInfo.value.data as any)?.parsed?.info;
    return {
      totalSupply: data?.supply ?? '0',
      decimals: data?.decimals ?? 6,
    };
  }

  /**
   * Check if the Solana RPC connection is healthy.
   */
  async isHealthy(): Promise<{
    healthy: boolean;
    slot?: number;
    version?: string;
  }> {
    try {
      const connection = this.connectionFactory.getConnection();
      const [slot, version] = await Promise.all([
        connection.getSlot(),
        connection.getVersion(),
      ]);
      return {
        healthy: true,
        slot,
        version: version['solana-core'],
      };
    } catch {
      return { healthy: false };
    }
  }

  /**
   * Get the configured program ID.
   */
  getProgramId(): string {
    return this.configService.get<string>(
      'SSS_CORE_PROGRAM_ID',
      '7H7fqqjASpTDCgYwDpp8EatKM4sSMwxaYvbhf6s3ThqM',
    );
  }
}
