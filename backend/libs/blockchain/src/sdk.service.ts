import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicKey, Keypair } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork } from '@stbr/sss-token';
import * as bs58 from 'bs58';

/**
 * Injectable wrapper around the SSS SDK.
 *
 * Lazily loads the `SolanaStablecoin` instance on first use and caches it
 * for the lifetime of the application. All on-chain write operations
 * (mint, burn, blacklist, seize) are delegated through this service.
 */
@Injectable()
export class SdkService implements OnModuleInit {
  private readonly logger = new Logger(SdkService.name);
  private sdk: SolanaStablecoin | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const mintAddress = this.configService.get<string>('MINT_ADDRESS');
    if (mintAddress) {
      try {
        await this.getSdk();
        this.logger.log(`✅ SDK loaded for mint: ${mintAddress}`);
      } catch (err) {
        this.logger.warn(
          `⚠️  Could not pre-load SDK (mint may not be deployed yet): ${err}`,
        );
      }
    } else {
      this.logger.warn(
        '⚠️  MINT_ADDRESS not set — SDK will load on first request',
      );
    }
  }

  /**
   * Returns a cached SolanaStablecoin instance, loading it if needed.
   */
  async getSdk(): Promise<SolanaStablecoin> {
    if (this.sdk) return this.sdk;

    const mintAddress = this.configService.get<string>('MINT_ADDRESS');
    if (!mintAddress) {
      throw new Error('MINT_ADDRESS environment variable is required');
    }

    const network = this.getNetwork();
    this.sdk = await SolanaStablecoin.load(network, new PublicKey(mintAddress));
    return this.sdk;
  }

  /**
   * Decode a base58 secret key string into a Keypair.
   */
  decodeKeypair(base58SecretKey: string): Keypair {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
    const decode =
      bs58.decode ||
      (bs58 as unknown as { default: { decode: (a: string) => Uint8Array } })
        .default.decode;
    const secretKey = decode(base58SecretKey);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
    return Keypair.fromSecretKey(secretKey);
  }

  /**
   * Map SOLANA_NETWORK env var to the SDK's SolanaNetwork enum.
   */
  private getNetwork(): SolanaNetwork {
    const network = this.configService.get<string>('SOLANA_NETWORK', 'devnet');
    const networkMap: Record<string, SolanaNetwork> = {
      devnet: SolanaNetwork.DEVNET,
      mainnet: SolanaNetwork.MAINNET,
      testnet: SolanaNetwork.TESTNET,
      localnet: SolanaNetwork.LOCALNET,
    };
    return networkMap[network.toLowerCase()] ?? SolanaNetwork.DEVNET;
  }
}
