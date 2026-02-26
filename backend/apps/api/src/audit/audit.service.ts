import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@app/shared';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get paginated audit log entries.
     */
    async getAuditLog(params: {
        mint?: string;
        action?: string;
        actor?: string;
        page?: number;
        pageSize?: number;
    }) {
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.min(
            MAX_PAGE_SIZE,
            Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
        );
        const skip = (page - 1) * pageSize;

        const where: any = {};
        if (params.mint) where.mint = params.mint;
        if (params.action) where.action = params.action;
        if (params.actor) where.actor = params.actor;

        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    /**
     * Export audit log as CSV text.
     */
    async exportCsv(params: {
        mint?: string;
        action?: string;
    }): Promise<string> {
        const where: any = {};
        if (params.mint) where.mint = params.mint;
        if (params.action) where.action = params.action;

        const entries = await this.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        const header =
            'id,mint,action,actor,target,amount,reason,txSignature,createdAt';
        const rows = entries.map(
            (e) =>
                `${e.id},${e.mint},${e.action},${e.actor},${e.target ?? ''},${e.amount?.toString() ?? ''},${this.escapeCsv(e.reason ?? '')},${e.txSignature},${e.createdAt.toISOString()}`,
        );

        return [header, ...rows].join('\n');
    }

    private escapeCsv(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}
