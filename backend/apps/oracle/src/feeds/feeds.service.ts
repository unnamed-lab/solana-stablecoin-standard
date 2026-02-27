import { Injectable, Logger } from '@nestjs/common';
import { OracleSdkService } from '../oracle-sdk.service';
import { RegisterFeedDto } from './dto/register-feed.dto';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);
  
  constructor(
    private readonly oracleSdk: OracleSdkService,
    private readonly configService: ConfigService,
  ) {}

  async listFeeds() {
    this.logger.log('Fetching registered feeds...');
    return await this.oracleSdk.oracle.listFeeds(this.oracleSdk.programId);
  }

  async registerFeed(dto: RegisterFeedDto) {
    this.logger.log(`Registering new feed: ${dto.symbol}`);
    
    // Using admin wallet from env to sign the transaction.
    const secretKeyString = this.configService.get<string>('ADMIN_WALLET_SECRET_KEY');
    if (!secretKeyString) {
      throw new Error('ADMIN_WALLET_SECRET_KEY is not configured');
    }
    const adminKeypair = Keypair.fromSecretKey(bs58.decode(secretKeyString));

    const txSig = await this.oracleSdk.oracle.registerFeed(
      adminKeypair,
      this.oracleSdk.programId,
      {
        symbol: dto.symbol,
        feedType: dto.feedType,
        baseCurrency: dto.baseCurrency,
        quoteCurrency: dto.quoteCurrency,
        decimals: dto.decimals,
        switchboardFeed: dto.switchboardFeed,
      }
    );

    return { success: true, txSig };
  }
}
