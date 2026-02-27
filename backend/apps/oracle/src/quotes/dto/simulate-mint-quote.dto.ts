import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedType } from '@stbr/sss-token';
import { Transform } from 'class-transformer';

export class SimulateMintQuoteDto {
  @ApiProperty({ example: 10000, description: 'USD input amount in cents (e.g., $100 = 10000)' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  usdCents: number;

  @ApiProperty({ example: 5720000, description: 'Price * PRICE_SCALE (1_000_000)' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  priceScaled: number;

  @ApiProperty({ enum: FeedType })
  @IsEnum(FeedType)
  feedType: FeedType;

  @ApiProperty({ example: 30, description: 'Mint fee in basis points (e.g., 30 = 0.3%)' })
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  mintFeeBps: number;

  @ApiPropertyOptional({ example: 1000000, description: 'CPI Multiplier * 10^6' })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  cpiMultiplier?: number;
}
