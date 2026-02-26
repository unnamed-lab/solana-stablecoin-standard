import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Connection, PublicKey, Logs, Context } from '@solana/web3.js';
import { PrismaService } from '@app/database';
import {
  WEBHOOK_QUEUE,
  WEBHOOK_RETRY_ATTEMPTS,
  WEBHOOK_RETRY_DELAY_MS,
  AuditAction,
} from '@app/shared';
import { EventParserUtil } from './event-parser';

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  private connection: Connection;
  private subscriptionId: number | null = null;
  private parser: EventParserUtil;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue(WEBHOOK_QUEUE)
    private readonly webhookQueue: Queue,
  ) { }

  async onModuleInit() {
    const rpcUrl = this.configService.get<string>(
      'RPC_URL',
      'https://api.devnet.solana.com',
    );
    const wsUrl = this.configService.get<string>('WS_URL');
    const programId = this.configService.get<string>(
      'SSS_CORE_PROGRAM_ID',
      '7H7fqqjASpTDCgYwDpp8EatKM4sSMwxaYvbhf6s3ThqM',
    );

    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      ...(wsUrl ? { wsEndpoint: wsUrl } : {}),
    });

    this.parser = new EventParserUtil(programId);

    this.subscriptionId = this.connection.onLogs(
      new PublicKey(programId),
      (logs: Logs, ctx: Context) =>
        this.handleLogs(logs.logs, logs.signature, ctx),
      'confirmed',
    );

    this.logger.log(`✅ Subscribed to program logs: ${programId}`);
  }

  async onModuleDestroy() {
    if (this.subscriptionId !== null) {
      await this.connection.removeOnLogsListener(this.subscriptionId);
      this.logger.log('Unsubscribed from program logs');
    }
  }

  private async handleLogs(
    logs: string[],
    signature: string,
    _ctx: Context,
  ) {
    const events = this.parser.parse(logs);
    if (!events.length) return;

    for (const event of events) {
      this.logger.log(`📡 Event: ${event.name} | tx: ${signature}`);

      try {
        await this.persistEvent(event, signature);

        // Enqueue webhook delivery with retry
        await this.webhookQueue.add(
          'notify',
          { event, signature },
          {
            attempts: WEBHOOK_RETRY_ATTEMPTS,
            backoff: {
              type: 'exponential',
              delay: WEBHOOK_RETRY_DELAY_MS,
            },
          },
        );
      } catch (err) {
        this.logger.error(
          `Failed to process event ${event.name}: ${err}`,
        );
      }
    }
  }

  private async persistEvent(
    event: { name: string; data: any },
    signature: string,
  ) {
    const { name, data } = event;

    switch (name) {
      case 'Minted':
        await this.prisma.$transaction([
          this.prisma.mintEvent.create({
            data: {
              mint: data.mint,
              recipient: data.recipient,
              amount: BigInt(data.amount),
              minter: data.minter,
              newTotalSupply: BigInt(data.newTotalSupply),
              txSignature: signature,
              onChainTimestamp: BigInt(data.timestamp),
            },
          }),
          this.prisma.auditLog.create({
            data: {
              mint: data.mint,
              action: AuditAction.MINT,
              actor: data.minter,
              target: data.recipient,
              amount: BigInt(data.amount),
              txSignature: signature,
            },
          }),
        ]);
        break;

      case 'Burned':
        await this.prisma.$transaction([
          this.prisma.burnEvent.create({
            data: {
              mint: data.mint,
              source: data.from,
              amount: BigInt(data.amount),
              burner: data.burner,
              newTotalSupply: BigInt(data.newTotalSupply),
              txSignature: signature,
              onChainTimestamp: BigInt(data.timestamp),
            },
          }),
          this.prisma.auditLog.create({
            data: {
              mint: data.mint,
              action: AuditAction.BURN,
              actor: data.burner,
              target: data.from,
              amount: BigInt(data.amount),
              txSignature: signature,
            },
          }),
        ]);
        break;

      case 'Blacklisted':
        await this.prisma.$transaction([
          this.prisma.blacklistEntry.create({
            data: {
              mint: data.mint,
              address: data.address,
              reason: data.reason,
              blacklistedBy: data.blacklistedBy,
              txSignature: signature,
              onChainTimestamp: BigInt(data.timestamp),
            },
          }),
          this.prisma.auditLog.create({
            data: {
              mint: data.mint,
              action: AuditAction.BLACKLIST_ADD,
              actor: data.blacklistedBy,
              target: data.address,
              reason: data.reason,
              txSignature: signature,
            },
          }),
        ]);
        break;

      case 'RemovedFromBlacklist':
        await this.prisma.$transaction([
          this.prisma.blacklistEntry.updateMany({
            where: {
              address: data.address,
              removed: false,
            },
            data: {
              removed: true,
              removedBy: data.removedBy,
              removedAt: new Date(),
            },
          }),
          this.prisma.auditLog.create({
            data: {
              mint: data.mint,
              action: AuditAction.BLACKLIST_REMOVE,
              actor: data.removedBy,
              target: data.address,
              txSignature: signature,
            },
          }),
        ]);
        break;

      case 'Seized':
        await this.prisma.$transaction([
          this.prisma.seizureEvent.create({
            data: {
              mint: data.mint,
              seizedFrom: data.seizedFrom,
              seizedTo: data.seizedTo,
              amount: BigInt(data.amount),
              reason: data.reason,
              seizer: data.seizer,
              txSignature: signature,
              onChainTimestamp: BigInt(data.timestamp),
            },
          }),
          this.prisma.auditLog.create({
            data: {
              mint: data.mint,
              action: AuditAction.SEIZE,
              actor: data.seizer,
              target: data.seizedFrom,
              amount: BigInt(data.amount),
              reason: data.reason,
              txSignature: signature,
            },
          }),
        ]);
        break;

      case 'PausedEvent':
        await this.prisma.auditLog.create({
          data: {
            mint: data.mint,
            action: AuditAction.PAUSE,
            actor: data.by,
            txSignature: signature,
          },
        });
        break;

      case 'UnpausedEvent':
        await this.prisma.auditLog.create({
          data: {
            mint: data.mint,
            action: AuditAction.UNPAUSE,
            actor: data.by,
            txSignature: signature,
          },
        });
        break;

      case 'AccountFrozenEvent':
        await this.prisma.auditLog.create({
          data: {
            mint: data.mint,
            action: AuditAction.FREEZE,
            actor: data.by,
            target: data.account,
            txSignature: signature,
          },
        });
        break;

      case 'AccountThawedEvent':
        await this.prisma.auditLog.create({
          data: {
            mint: data.mint,
            action: AuditAction.THAW,
            actor: data.by,
            target: data.account,
            txSignature: signature,
          },
        });
        break;

      default:
        this.logger.debug(`Unhandled event type: ${name}`);
    }
  }
}
