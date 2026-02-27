import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FeedsModule } from './feeds/feeds.module';
import { OracleConfigModule } from './config/config.module';
import { QuotesModule } from './quotes/quotes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FeedsModule,
    OracleConfigModule,
    QuotesModule,
  ],
})
export class OracleModule {}
