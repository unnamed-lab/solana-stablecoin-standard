import { Injectable, Logger } from '@nestjs/common';
import { BlockchainService, SdkService } from '@app/blockchain';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
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

    // Derive the Token-2022 ATA for this wallet + mint
    const recipientAta = getAssociatedTokenAddressSync(
      sdk.mintAddress,
      recipientWallet,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    // Create the ATA if it doesn't exist yet
    const connection = this.blockchainService.getConnection();
    const ataInfo = await connection.getAccountInfo(recipientAta);
    if (!ataInfo) {
      this.logger.log(`Creating ATA for ${dto.recipient}...`);
      const createAtaTx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          minter.publicKey, // payer
          recipientAta,
          recipientWallet,
          sdk.mintAddress,
          TOKEN_2022_PROGRAM_ID,
        ),
      );
      const latestBlockhash = await connection.getLatestBlockhash();
      createAtaTx.recentBlockhash = latestBlockhash.blockhash;
      createAtaTx.feePayer = minter.publicKey;
      createAtaTx.sign(minter);
      const ataSignature = await connection.sendRawTransaction(
        createAtaTx.serialize(),
      );
      await connection.confirmTransaction(ataSignature, 'confirmed');
      this.logger.log(`✅ ATA created: ${recipientAta.toBase58()}`);
    }

    const txSignature = await sdk.mint({
      recipient: recipientAta,
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

    // Derive the source ATA — either from the supplied address or the burner's wallet
    const sourceWallet = dto.source
      ? new PublicKey(dto.source)
      : burner.publicKey;

    const sourceAta = getAssociatedTokenAddressSync(
      sdk.mintAddress,
      sourceWallet,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    const txSignature = await sdk.burn({
      amount: dto.amount,
      burner,
      source: sourceAta,
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
