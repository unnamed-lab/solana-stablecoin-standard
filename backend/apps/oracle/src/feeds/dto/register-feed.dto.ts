import { IsString, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FeedType } from '@stbr/sss-token';
import { PublicKey } from '@solana/web3.js';
import { Transform } from 'class-transformer';

export class RegisterFeedDto {
  @ApiProperty({ example: 'BRLUSD' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ enum: FeedType })
  @IsEnum(FeedType)
  feedType: FeedType;

  @ApiProperty({ example: 'BRL' })
  @IsString()
  @IsNotEmpty()
  baseCurrency: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  quoteCurrency: string;

  @ApiProperty({ example: 8 })
  @IsNumber()
  decimals: number;

  @ApiProperty({ example: '8GWTTbNiXdmyZREXbjsZBmCRuzdPrW55dnZGDkTRjWvb' })
  @IsNotEmpty()
  @Transform(({ value }) => {
    try {
      return new PublicKey(value);
    } catch {
      return value;
    }
  })
  switchboardFeed: PublicKey;
}
