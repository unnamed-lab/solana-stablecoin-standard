import { IsString, IsNumber, IsPositive, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SeizeDto {
  @ApiProperty({
    example: 'Gx8f...',
    description: 'Token account to seize from (must be frozen)',
  })
  @IsString()
  from: string;

  @ApiProperty({
    example: 'Hy9g...',
    description: 'Token account to seize to',
  })
  @IsString()
  to: string;

  @ApiProperty({
    example: 1000000,
    description: 'Amount to seize in base units',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 'Court order #12345',
    description: 'Legal or compliance reason for the seizure',
  })
  @IsString()
  @MaxLength(200)
  reason: string;

  @ApiProperty({
    description: 'Base58-encoded seizer keypair secret key',
  })
  @IsString()
  seizerKeypair: string;
}
