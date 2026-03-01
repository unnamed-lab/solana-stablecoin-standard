import { Injectable, Logger } from '@nestjs/common';
import { OracleSdkService } from '../oracle-sdk.service';
import { InitializeConfigDto } from './dto/initialize-config.dto';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(
    private readonly oracleSdk: OracleSdkService,
    private readonly nestConfig: NestConfigService,
  ) { }

  async getOracleInfo(mintAddress: string) {
    this.logger.log(`Fetching oracle info for mint: ${mintAddress}`);
    const mintPubkey = new PublicKey(mintAddress);

    // The SDK method returns a snapshot of the OracleConfig parsing the BN units
    return await this.oracleSdk.oracle.getOracleInfo(
      this.oracleSdk.programId,
      mintPubkey
    );
  }

  async initializeOracle(dto: InitializeConfigDto) {
    this.logger.log(`Initializing oracle config for mint: ${dto.mint.toBase58()}`);

    // Using admin wallet from env to sign the transaction.
    const secretKeyString = this.nestConfig.get<string>('ADMIN_WALLET_SECRET_KEY');
    if (!secretKeyString) {
      throw new Error('ADMIN_WALLET_SECRET_KEY is not configured');
    }
    const adminKeypair = Keypair.fromSecretKey(bs58.decode(secretKeyString));

    const txSig = await this.oracleSdk.oracle.initializeOracle(
      adminKeypair,
      this.oracleSdk.programId,
      {
        mint: dto.mint,
        feedSymbol: dto.feedSymbol,
        description: dto.description || '',
        maxStalenessSecs: dto.maxStalenessSecs,
        mintFeeBps: dto.mintFeeBps,
        redeemFeeBps: dto.redeemFeeBps,
        maxConfidenceBps: dto.maxConfidenceBps,
        quoteValiditySecs: dto.quoteValiditySecs,
        cpiMultiplier: dto.cpiMultiplier || 1_000_000,
        cpiMinUpdateInterval: dto.cpiMinUpdateInterval || 0,
        cpiDataSource: dto.cpiDataSource || '',
      }
    );

    return { success: true, txSig };
  }

  async initializeRegistry() {
    this.logger.log(`Initializing global feed registry`);

    // Using admin wallet from env to sign the transaction.
    const secretKeyString = this.nestConfig.get<string>('ADMIN_WALLET_SECRET_KEY');
    if (!secretKeyString) {
      throw new Error('ADMIN_WALLET_SECRET_KEY is not configured');
    }
    const adminKeypair = Keypair.fromSecretKey(bs58.decode(secretKeyString));

    const txSig = await this.oracleSdk.oracle.initializeRegistry(
      adminKeypair,
      this.oracleSdk.programId
    );

    return { success: true, txSig };
  }
}
