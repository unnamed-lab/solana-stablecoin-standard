import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedType } from '@stbr/sss-token';
import { Transform } from 'class-transformer';

export class SimulateRedeemQuoteDto {
  @ApiProperty({ example: 572000000, description: 'Token amount in base units' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  tokenAmount: number;

  @ApiProperty({ example: 5720000, description: 'Price * PRICE_SCALE (1_000_000)' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  priceScaled: number;

  @ApiProperty({ enum: FeedType })
  @IsEnum(FeedType)
  feedType: FeedType;

  @ApiProperty({ example: 30, description: 'Redeem fee in basis points (e.g., 30 = 0.3%)' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  redeemFeeBps: number;

  @ApiPropertyOptional({ example: 1000000, description: 'CPI Multiplier * 10^6' })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  cpiMultiplier?: number;
}
