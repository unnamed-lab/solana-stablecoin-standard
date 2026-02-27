import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicKey } from '@solana/web3.js';
import { Transform } from 'class-transformer';

export class InitializeConfigDto {
  @ApiProperty({ example: '8GWTTbNiXdmyZREXbjsZBmCRuzdPrW55dnZGDkTRjWvb' })
  @IsNotEmpty()
  @Transform(({ value }) => {
    try {
      return new PublicKey(value);
    } catch {
      return value;
    }
  })
  mint: PublicKey;

  @ApiProperty({ example: 'BRLUSD' })
  @IsString()
  @IsNotEmpty()
  feedSymbol: string;

  @ApiPropertyOptional({ example: 'Brazilian Real Stablecoin' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 120, description: 'Seconds before price feed is considered stale' })
  @IsNumber()
  maxStalenessSecs: number;

  @ApiProperty({ example: 30, description: 'Mint fee in basis points (e.g. 30 = 0.3%)' })
  @IsNumber()
  mintFeeBps: number;

  @ApiProperty({ example: 30, description: 'Redeem fee in basis points' })
  @IsNumber()
  redeemFeeBps: number;

  @ApiProperty({ example: 50, description: 'Max allowed confidence interval from Switchboard (bps)' })
  @IsNumber()
  maxConfidenceBps: number;

  @ApiProperty({ example: 60, description: 'Seconds a generated quote remains valid for execution' })
  @IsNumber()
  quoteValiditySecs: number;

  @ApiPropertyOptional({ example: 1000000, description: 'CPI Multiplier * 10^6' })
  @IsNumber()
  @IsOptional()
  cpiMultiplier?: number;

  @ApiPropertyOptional({ example: 2592000, description: 'Minimum seconds between CPI updates' })
  @IsNumber()
  @IsOptional()
  cpiMinUpdateInterval?: number;

  @ApiPropertyOptional({ example: 'IBGE IPCA' })
  @IsString()
  @IsOptional()
  cpiDataSource?: string;
}
