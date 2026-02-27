import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { OracleSdkModule } from '../oracle-sdk.module';

@Module({
  imports: [OracleSdkModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
