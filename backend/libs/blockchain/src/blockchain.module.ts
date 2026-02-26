import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { ConnectionFactory } from './connection.factory';

@Module({
  imports: [ConfigModule],
  providers: [BlockchainService, ConnectionFactory],
  exports: [BlockchainService, ConnectionFactory],
})
export class BlockchainModule { }
