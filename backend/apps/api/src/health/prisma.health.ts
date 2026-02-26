import { Injectable } from '@nestjs/common';
import {
    HealthIndicator,
    HealthIndicatorResult,
    HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '@app/database';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return this.getStatus(key, true);
        } catch (e) {
            throw new HealthCheckError(
                'Database check failed',
                this.getStatus(key, false, {
                    message: e instanceof Error ? e.message : 'Unknown error',
                }),
            );
        }
    }
}
