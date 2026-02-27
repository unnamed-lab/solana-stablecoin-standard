import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from '@app/database';
import { BlockchainModule } from '@app/blockchain';
import { WEBHOOK_QUEUE } from '@app/shared';
import { HealthModule } from './health/health.module';
import { TokenModule } from './token/token.module';
import { ComplianceModule } from './compliance/compliance.module';
import { AuditModule } from './audit/audit.module';
import { WebhookConfigModule } from './webhook-config/webhook-config.module';

@Module({
  imports: [
    // Global config from environment variables
    ConfigModule.forRoot({ isGlobal: true }),

    // Database (Prisma) — globally available
    DatabaseModule,

    // Blockchain / Solana
    BlockchainModule,

    // Health checks
    TerminusModule,

    // Rate limiting — applied globally via ThrottlerGuard
    // "default" = 60 requests per 60 seconds (for GET endpoints)
    // Controllers override with "strict" for write operations
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 60 },
      { name: 'strict', ttl: 60000, limit: 10 },
    ]),

    // Bull queue (shared with indexer/webhook apps)
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    BullModule.registerQueue({ name: WEBHOOK_QUEUE }),

    // Feature modules
    HealthModule,
    TokenModule,
    ComplianceModule,
    AuditModule,
    WebhookConfigModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiModule {}

