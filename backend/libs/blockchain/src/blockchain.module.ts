import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { ConnectionFactory } from './connection.factory';
import { SdkService } from './sdk.service';

@Module({
  imports: [ConfigModule],
  providers: [BlockchainService, ConnectionFactory, SdkService],
  exports: [BlockchainService, ConnectionFactory, SdkService],
})
export class BlockchainModule { }
