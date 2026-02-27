import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OracleSdkService } from './oracle-sdk.service';

@Module({
  imports: [ConfigModule],
  providers: [OracleSdkService],
  exports: [OracleSdkService],
})
export class OracleSdkModule {}
