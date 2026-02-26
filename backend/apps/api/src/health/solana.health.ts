import { Injectable } from '@nestjs/common';
import {
    HealthIndicator,
    HealthIndicatorResult,
    HealthCheckError,
} from '@nestjs/terminus';
import { BlockchainService } from '@app/blockchain';

@Injectable()
export class SolanaHealthIndicator extends HealthIndicator {
    constructor(private readonly blockchainService: BlockchainService) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            const { healthy, slot, version } =
                await this.blockchainService.isHealthy();
            if (!healthy) {
                throw new Error('Solana RPC unreachable');
            }
            return this.getStatus(key, true, { slot, version });
        } catch (e) {
            throw new HealthCheckError(
                'Solana RPC check failed',
                this.getStatus(key, false, {
                    message: e instanceof Error ? e.message : 'Unknown error',
                }),
            );
        }
    }
}
