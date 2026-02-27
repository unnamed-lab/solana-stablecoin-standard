import { Module } from '@nestjs/common';
import { BlockchainModule } from '@app/blockchain';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';

@Module({
  imports: [BlockchainModule],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
