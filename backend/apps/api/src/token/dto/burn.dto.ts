import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BurnDto {
  @ApiProperty({
    example: 500000,
    description: 'Amount to burn in base units',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Base58-encoded burner keypair secret key',
  })
  @IsString()
  burnerKeypair: string;

  @ApiPropertyOptional({
    example: 'Gx8f...',
    description:
      'Source token account to burn from. Defaults to burner ATA if omitted.',
  })
  @IsOptional()
  @IsString()
  source?: string;
}
