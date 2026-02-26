import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { BlockchainModule } from '@app/blockchain';
import { HealthController } from './health.controller';
import { SolanaHealthIndicator } from './solana.health';
import { PrismaHealthIndicator } from './prisma.health';

@Module({
    imports: [TerminusModule, BlockchainModule],
    controllers: [HealthController],
    providers: [SolanaHealthIndicator, PrismaHealthIndicator],
})
export class HealthModule { }
