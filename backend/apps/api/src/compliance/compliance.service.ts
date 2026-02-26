import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { BlacklistDto } from './dto/blacklist.dto';
import { SeizeDto } from './dto/seize.dto';

@Injectable()
export class ComplianceService {
    private readonly logger = new Logger(ComplianceService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Add an address to the blacklist.
     * SDK integration point for on-chain blacklist transaction.
     */
    async blacklistAdd(
        dto: BlacklistDto,
    ): Promise<{ success: boolean; txSignature: string }> {
        this.logger.log(`Blacklist add: ${dto.address} — ${dto.reason}`);
        // TODO: Wire SDK
        return { success: true, txSignature: 'pending-sdk-integration' };
    }

    /**
     * Remove an address from the blacklist.
     */
    async blacklistRemove(
        address: string,
        blacklisterKeypair: string,
    ): Promise<{ success: boolean; txSignature: string }> {
        this.logger.log(`Blacklist remove: ${address}`);
        // TODO: Wire SDK
        return { success: true, txSignature: 'pending-sdk-integration' };
    }

    /**
     * Seize tokens from a frozen account.
     */
    async seize(
        dto: SeizeDto,
    ): Promise<{ success: boolean; txSignature: string }> {
        this.logger.log(
            `Seize: ${dto.amount} tokens from ${dto.from} to ${dto.to}`,
        );
        // TODO: Wire SDK
        return { success: true, txSignature: 'pending-sdk-integration' };
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
