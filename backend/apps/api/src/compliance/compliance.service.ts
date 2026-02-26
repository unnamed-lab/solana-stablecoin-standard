import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { SdkService } from '@app/blockchain';
import { PublicKey } from '@solana/web3.js';
import { BlacklistDto } from './dto/blacklist.dto';
import { SeizeDto } from './dto/seize.dto';

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
     * Check if an address is currently blacklisted.
     */
    async isBlacklisted(address: string, mint?: string): Promise<boolean> {
        const entry = await this.prisma.blacklistEntry.findFirst({
            where: {
                address,
                removed: false,
                ...(mint ? { mint } : {}),
            },
        });
        return entry !== null;
    }
}
