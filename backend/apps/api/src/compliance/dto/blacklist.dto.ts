import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlacklistDto {
  @ApiProperty({
    example: 'Gx8f...',
    description: 'Wallet address to blacklist (base58)',
  })
  @IsString()
  address: string;

  @ApiProperty({
    example: 'Suspicious activity detected',
    description: 'Human-readable reason for the blacklisting',
  })
  @IsString()
  @MaxLength(100)
  reason: string;

  @ApiProperty({
    description: 'Base58-encoded blacklister keypair secret key',
  })
  @IsString()
  blacklisterKeypair: string;
}


export class CheckWalletBlacklistDto {
  @ApiProperty({
    example: 'Gx8f...',
    description: 'Mint address to check blacklist (base58)',
    required: false,
  })
  @IsString()
  @IsOptional()
  mint: string;
}
