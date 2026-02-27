import { Injectable, Logger } from '@nestjs/common';
import { OracleSdkService } from '../oracle-sdk.service';
import { SimulateMintQuoteDto } from './dto/simulate-mint-quote.dto';
import { SimulateRedeemQuoteDto } from './dto/simulate-redeem-quote.dto';
import { FeedType } from '@stbr/sss-token';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(private readonly oracleSdk: OracleSdkService) {}

  async simulateMintQuote(dto: SimulateMintQuoteDto) {
    this.logger.debug(`Simulating mint quote for ${dto.usdCents} cents...`);

    return this.oracleSdk.oracle.simulateMintQuote(
      dto.usdCents,
      dto.priceScaled,
      dto.feedType as FeedType,
      dto.mintFeeBps,
      dto.cpiMultiplier,
    );
  }

  async simulateRedeemQuote(dto: SimulateRedeemQuoteDto) {
    this.logger.debug(`Simulating redeem quote for ${dto.tokenAmount} tokens...`);

    return this.oracleSdk.oracle.simulateRedeemQuote(
      dto.tokenAmount,
      dto.priceScaled,
      dto.feedType as FeedType,
      dto.redeemFeeBps,
      dto.cpiMultiplier,
    );
  }
}
