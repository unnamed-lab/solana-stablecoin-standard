import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService, SdkService } from '@app/blockchain';
import { PublicKey } from '@solana/web3.js';
import { PrismaService } from '@app/database';
import { MintDto } from './dto/mint.dto';
import { BurnDto } from './dto/burn.dto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly sdkService: SdkService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Mint new tokens to a recipient's associated token account.
   *
   * Accepts a plain wallet address as `recipient`. The service will
   * derive the Token-2022 ATA and create it on-chain if it doesn't
   * already exist.
   *
   * In production, keypairs would come from a KMS/HSM.
   * For the bounty demo, the keypair is passed in the request body.
   */
  async mint(dto: MintDto): Promise<{ success: boolean; txSignature: string }> {
    this.logger.log(`Mint request: ${dto.amount} tokens to ${dto.recipient}`);

    const sdk = await this.sdkService.getSdk();
    const minter = this.sdkService.decodeKeypair(dto.minterKeypair);
    const recipientWallet = new PublicKey(dto.recipient);

    // The SDK now handles ATA derivation and creation automatically
    const txSignature = await sdk.mint({
      recipient: recipientWallet,
      amount: dto.amount,
      minter,
    });

    this.logger.log(`✅ Mint tx: ${txSignature}`);
    return { success: true, txSignature };
  }

  /**
   * Burn tokens from a token account.
   *
   * If `source` is omitted, burns from the burner's own ATA.
   * If `source` is a wallet address, derives the ATA for that wallet.
   */
  async burn(dto: BurnDto): Promise<{ success: boolean; txSignature: string }> {
    this.logger.log(`Burn request: ${dto.amount} tokens`);

    const sdk = await this.sdkService.getSdk();
    const burner = this.sdkService.decodeKeypair(dto.burnerKeypair);

    // The SDK now handles wallet-to-ATA derivation automatically
    const txSignature = await sdk.burn({
      amount: dto.amount,
      burner,
      source: dto.source ? new PublicKey(dto.source) : undefined,
    });

    this.logger.log(`✅ Burn tx: ${txSignature}`);
    return { success: true, txSignature };
  }

  /**
   * Get current total supply from on-chain state, along with max and burn supply.
   */
  async getSupply(): Promise<{ totalSupply: string; maxSupply: string | null; burnSupply: string; decimals: number }> {
    const sdk = await this.sdkService.getSdk();
    const { totalSupply, decimals } = await this.blockchainService.getTotalSupply();

    const maxSupplyResult = await sdk.getMaxSupply();
    const maxSupply = maxSupplyResult === null ? null : maxSupplyResult.toString();

    // Sum all burned amounts for this mint from the database
    const burnAggregation = await this.prisma.burnEvent.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        mint: sdk.mintAddress.toBase58(),
      },
    });

    const burnSupply = burnAggregation._sum.amount ? burnAggregation._sum.amount.toString() : '0';

    return { totalSupply, maxSupply, burnSupply, decimals };
  }

  /**
   * Get the total number of unique token holders.
   */
  async getHoldersCount(): Promise<{ count: number }> {
    const sdk = await this.sdkService.getSdk();
    const count = await sdk.getHoldersCount();
    return { count };
  }

  /**
   * Get the largest token holders.
   */
  async getLargestHolders(minAmount?: number): Promise<any[]> {
    const sdk = await this.sdkService.getSdk();
    // Convert base58 to string for JSON serialization
    const holders = await sdk.getLargestHolders(minAmount);
    return holders.map((h) => ({
      address: h.address.toBase58(),
      amount: h.amount,
      decimals: h.decimals,
      uiAmount: h.uiAmount,
      uiAmountString: h.uiAmountString,
    }));
  }

  /**
   * Get the list of active minters (from on-chain configs)
   */
  async getMintersList(): Promise<Array<{ pubkey: string; note: string; }>> {
    try {
      const sdk = await this.sdkService.getSdk();
      const minters = await sdk.getMinters();

      return minters.map((m) => ({
        pubkey: m.minter.toBase58(),
        note: `Quota: ${m.quota} | Active: ${m.isActive}`,
      }));
    } catch (err) {
      this.logger.error("Failed to fetch minter list", err);
      return [];
    }
  }
  /**
   * Get basic stablecoin information from on-chain state.
   */
  async getInfo(): Promise<any> {
    const sdk = await this.sdkService.getSdk();
    return sdk.getInfo();
  }
}
