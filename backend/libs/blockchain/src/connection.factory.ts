import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection } from '@solana/web3.js';

@Injectable()
export class ConnectionFactory {
    private connection: Connection | null = null;

    constructor(private readonly configService: ConfigService) { }

    /**
     * Returns a singleton Solana RPC connection.
     */
    getConnection(): Connection {
        if (!this.connection) {
            const rpcUrl = this.configService.get<string>('RPC_URL', 'https://api.devnet.solana.com');
            const wsUrl = this.configService.get<string>('WS_URL');

            this.connection = new Connection(rpcUrl, {
                commitment: 'confirmed',
                ...(wsUrl ? { wsEndpoint: wsUrl } : {}),
            });
        }
        return this.connection;
    }
}
