import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService } from '@app/blockchain';
import { MintDto } from './dto/mint.dto';
import { BurnDto } from './dto/burn.dto';

@Injectable()
export class TokenService {
    private readonly logger = new Logger(TokenService.name);

    constructor(private readonly blockchainService: BlockchainService) { }

    /**
     * Mint new tokens.
     *
     * In production, keypairs would come from a KMS/HSM.
     * For the bounty demo, the keypair is passed in the request body.
     */
    async mint(
        dto: MintDto,
    ): Promise<{ success: boolean; txSignature: string }> {
        // SDK integration point — for now, returns a placeholder
        // In a full integration, this calls:
        //   const sdk = await SolanaStablecoin.load(...);
        //   const sig = await sdk.mint({ recipient, amount, minter });
        this.logger.log(
            `Mint request: ${dto.amount} tokens to ${dto.recipient}`,
        );

        // TODO: Wire SDK when available as a NestJS-compatible import
        return {
            success: true,
            txSignature: 'pending-sdk-integration',
        };
    }

    /**
     * Burn tokens.
     */
    async burn(
        dto: BurnDto,
    ): Promise<{ success: boolean; txSignature: string }> {
        this.logger.log(`Burn request: ${dto.amount} tokens`);

        return {
            success: true,
            txSignature: 'pending-sdk-integration',
        };
    }

    /**
     * Get current total supply from on-chain state.
     */
    async getSupply(): Promise<{ totalSupply: string; decimals: number }> {
        return this.blockchainService.getTotalSupply();
    }
}
