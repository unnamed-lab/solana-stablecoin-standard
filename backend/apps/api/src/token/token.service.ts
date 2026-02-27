import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService, SdkService } from '@app/blockchain';
import { PublicKey } from '@solana/web3.js';
import { MintDto } from './dto/mint.dto';
import { BurnDto } from './dto/burn.dto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly sdkService: SdkService,
  ) {}

  /**
   * Mint new tokens to a recipient's associated token account.
   *
   * In production, keypairs would come from a KMS/HSM.
   * For the bounty demo, the keypair is passed in the request body.
   */
  async mint(dto: MintDto): Promise<{ success: boolean; txSignature: string }> {
    this.logger.log(`Mint request: ${dto.amount} tokens to ${dto.recipient}`);

    const sdk = await this.sdkService.getSdk();
    const minter = this.sdkService.decodeKeypair(dto.minterKeypair);

    const txSignature = await sdk.mint({
      recipient: new PublicKey(dto.recipient),
      amount: dto.amount,
      minter,
    });

    this.logger.log(`✅ Mint tx: ${txSignature}`);
    return { success: true, txSignature };
  }

  /**
   * Burn tokens from a token account.
   */
  async burn(dto: BurnDto): Promise<{ success: boolean; txSignature: string }> {
    this.logger.log(`Burn request: ${dto.amount} tokens`);

    const sdk = await this.sdkService.getSdk();
    const burner = this.sdkService.decodeKeypair(dto.burnerKeypair);

    const txSignature = await sdk.burn({
      amount: dto.amount,
      burner,
      ...(dto.source ? { source: new PublicKey(dto.source) } : {}),
    });

    this.logger.log(`✅ Burn tx: ${txSignature}`);
    return { success: true, txSignature };
  }

  /**
   * Get current total supply from on-chain state.
   */
  async getSupply(): Promise<{ totalSupply: string; decimals: number }> {
    return this.blockchainService.getTotalSupply();
  }
}
