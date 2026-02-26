import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicKey, Keypair } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork } from '@stbr/sss-token';

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

    constructor(private readonly configService: ConfigService) { }

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
        this.sdk = await SolanaStablecoin.load(
            network,
            new PublicKey(mintAddress),
        );
        return this.sdk;
    }

    /**
     * Decode a base58 secret key string into a Keypair.
     */
    decodeKeypair(base58SecretKey: string): Keypair {
        const bs58 = require('bs58');
        const secretKey = bs58.default
            ? bs58.default.decode(base58SecretKey)
            : bs58.decode(base58SecretKey);
        return Keypair.fromSecretKey(secretKey);
    }

    /**
     * Map SOLANA_NETWORK env var to the SDK's SolanaNetwork enum.
     */
    private getNetwork(): SolanaNetwork {
        const network = this.configService.get<string>(
            'SOLANA_NETWORK',
            'devnet',
        );
        const networkMap: Record<string, SolanaNetwork> = {
            devnet: SolanaNetwork.DEVNET,
            mainnet: SolanaNetwork.MAINNET,
            testnet: SolanaNetwork.TESTNET,
            localnet: SolanaNetwork.LOCALNET,
        };
        return networkMap[network.toLowerCase()] ?? SolanaNetwork.DEVNET;
    }
}
