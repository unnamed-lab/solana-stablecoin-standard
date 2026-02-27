import { Module } from '@nestjs/common';
import { FeedsController } from './feeds.controller';
import { FeedsService } from './feeds.service';
import { OracleSdkModule } from '../oracle-sdk.module';

@Module({
  imports: [OracleSdkModule],
  controllers: [FeedsController],
  providers: [FeedsService],
})
export class FeedsModule {}
