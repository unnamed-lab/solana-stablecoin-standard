import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { SimulateMintQuoteDto } from './dto/simulate-mint-quote.dto';
import { SimulateRedeemQuoteDto } from './dto/simulate-redeem-quote.dto';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('mint/simulate')
  @ApiOperation({ summary: 'Simulate a mint quote (Local pure math, no RPC)' })
  @ApiResponse({ status: 200, description: 'Simulated mint quote returned.' })
  async simulateMintQuote(@Query() dto: SimulateMintQuoteDto) {
    return this.quotesService.simulateMintQuote(dto);
  }

  @Get('redeem/simulate')
  @ApiOperation({ summary: 'Simulate a redeem quote (Local pure math, no RPC)' })
  @ApiResponse({ status: 200, description: 'Simulated redeem quote returned.' })
  async simulateRedeemQuote(@Query() dto: SimulateRedeemQuoteDto) {
    return this.quotesService.simulateRedeemQuote(dto);
  }
}
