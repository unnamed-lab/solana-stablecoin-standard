import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SolanaHealthIndicator } from './solana.health';
import { PrismaHealthIndicator } from './prisma.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly memory: MemoryHealthIndicator,
        private readonly solana: SolanaHealthIndicator,
        private readonly prisma: PrismaHealthIndicator,
    ) { }

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Service health check' })
    @ApiResponse({ status: 200, description: 'All systems operational' })
    @ApiResponse({ status: 503, description: 'One or more checks failed' })
    check() {
        return this.health.check([
            () => this.prisma.isHealthy('postgres'),
            () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024),
            () => this.solana.isHealthy('solana_rpc'),
        ]);
    }
}
