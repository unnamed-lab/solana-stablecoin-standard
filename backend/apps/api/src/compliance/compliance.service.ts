import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { SdkService } from '@app/blockchain';
import { PublicKey } from '@solana/web3.js';
import { BlacklistDto } from './dto/blacklist.dto';
import { SeizeDto } from './dto/seize.dto';
import { AllowlistAddDto } from './dto/allowlist.dto';
import { AllowlistOps } from '@stbr/sss-token';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sdkService: SdkService,
  ) { }

  /**
   * Add an address to the on-chain blacklist.
   * Automatically freezes the target's token account.
   */
  async blacklistAdd(
    dto: BlacklistDto,
  ): Promise<{ success: boolean; txSignature: string }> {
    this.logger.log(`Blacklist add: ${dto.address} — ${dto.reason}`);

    const sdk = await this.sdkService.getSdk();
    const authority = this.sdkService.decodeKeypair(dto.blacklisterKeypair);

    const txSignature = await sdk.compliance.blacklistAdd(authority, {
      address: new PublicKey(dto.address),
      reason: dto.reason,
    });

    this.logger.log(`✅ Blacklist add tx: ${txSignature}`);
    return { success: true, txSignature };
  }

  /**
   * Remove an address from the on-chain blacklist.
   * Automatically thaws the target's token account.
   */
  async blacklistRemove(
    address: string,
    blacklisterKeypair: string,
  ): Promise<{ success: boolean; txSignature: string }> {
    this.logger.log(`Blacklist remove: ${address}`);

    const sdk = await this.sdkService.getSdk();
    const authority = this.sdkService.decodeKeypair(blacklisterKeypair);

    const txSignature = await sdk.compliance.blacklistRemove(
      authority,
      new PublicKey(address),
    );

    this.logger.log(`✅ Blacklist remove tx: ${txSignature}`);
    return { success: true, txSignature };
  }

  /**
   * Seize tokens from a frozen account.
   * Requires the permanent delegate extension (SSS-2).
   */
  async seize(
    dto: SeizeDto,
  ): Promise<{ success: boolean; txSignature: string }> {
    this.logger.log(
      `Seize: ${dto.amount} tokens from ${dto.from} to ${dto.to}`,
    );

    const sdk = await this.sdkService.getSdk();
    const authority = this.sdkService.decodeKeypair(dto.seizerKeypair);

    const txSignature = await sdk.compliance.seize(
      authority,
      new PublicKey(dto.from),
      new PublicKey(dto.to),
      dto.amount,
      dto.reason,
    );

    this.logger.log(`✅ Seize tx: ${txSignature}`);
    return { success: true, txSignature };
  }

  /**
   * Get the active blacklist from the database.
   *
   * Note: Requires the indexer service to be running to populate DB
   * from on-chain events.
   */
  async getBlacklist(mint?: string) {
    return this.prisma.blacklistEntry.findMany({
      where: {
        removed: false,
        ...(mint ? { mint } : {}),
      },
      orderBy: { indexedAt: 'desc' },
    });
  }

  /**
   * Check if an address is currently blacklisted using the on-chain PDA.
   * This is authoritative and works regardless of indexer state.
   */
  async isBlacklisted(address: string, _mint?: string): Promise<boolean> {
    try {
      const sdk = await this.sdkService.getSdk();
      return await sdk.compliance.isBlacklisted(new PublicKey(address));
    } catch (err) {
      this.logger.warn(
        `On-chain blacklist check failed, falling back to DB: ${err}`,
      );
      // Fallback to DB if SDK check fails
      const entry = await this.prisma.blacklistEntry.findFirst({
        where: {
          address,
          removed: false,
        },
      });
      return entry !== null;
    }
  }

  // ── SSS-3 Allowlist ──

  async allowlistAdd(
    dto: AllowlistAddDto,
  ): Promise<{ success: boolean; txSignature: string }> {
    this.logger.log(`Allowlist add: ${dto.address} — ${dto.reason}`);

    const sdk = await this.sdkService.getSdk();
    const authority = this.sdkService.decodeKeypair(dto.allowlisterKeypair);

    const txSignature = await sdk.sss3.addToAllowlist(authority, {
      address: new PublicKey(dto.address),
      allowedOperations: dto.allowedOperations,
      kycTier: dto.kycTier,
      expiry: dto.expiry ? new Date(dto.expiry * 1000) : undefined,
      reason: dto.reason,
    });

    this.logger.log(`✅ Allowlist add tx: ${txSignature}`);
    return { success: true, txSignature };
  }

  async allowlistRemove(
    address: string,
    allowlisterKeypair: string,
  ): Promise<{ success: boolean; txSignature: string }> {
    this.logger.log(`Allowlist remove: ${address}`);

    const sdk = await this.sdkService.getSdk();
    const authority = this.sdkService.decodeKeypair(allowlisterKeypair);

    const txSignature = await sdk.sss3.removeFromAllowlist(
      authority,
      new PublicKey(address),
    );

    this.logger.log(`✅ Allowlist remove tx: ${txSignature}`);
    return { success: true, txSignature };
  }

  async getAllowlist(mint?: string) {
    return this.prisma.allowlistEntry.findMany({
      where: {
        active: true,
        ...(mint ? { mint } : {}),
      },
      orderBy: { indexedAt: 'desc' },
    });
  }

  async isAllowlisted(address: string, operation: AllowlistOps, _mint?: string): Promise<boolean> {
    try {
      const sdk = await this.sdkService.getSdk();
      return await sdk.sss3.canTransact(new PublicKey(address), operation);
    } catch (err) {
      this.logger.warn(`On-chain allowlist check failed, falling back to DB: ${err}`);
      const entry = await this.prisma.allowlistEntry.findFirst({
        where: {
          address,
          active: true,
        },
      });
      if (!entry) return false;
      if (entry.expiry > 0 && entry.expiry * 1000n < BigInt(Date.now())) return false;
      return (entry.allowedOperations & operation) !== 0;
    }
  }
}

