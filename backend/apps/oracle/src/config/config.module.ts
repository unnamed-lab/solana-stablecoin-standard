import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { OracleSdkModule } from '../oracle-sdk.module';

@Module({
  imports: [OracleSdkModule],
  controllers: [ConfigController],
  providers: [ConfigService],
})
export class OracleConfigModule {}
