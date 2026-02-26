import { IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MintDto {
    @ApiProperty({
        example: 'Gx8f...',
        description: 'Recipient wallet address (base58)',
    })
    @IsString()
    recipient: string;

    @ApiProperty({
        example: 1000000,
        description: 'Amount in base units (1 USDC = 1_000_000)',
    })
    @IsNumber()
    @IsPositive()
    amount: number;

    @ApiProperty({
        description:
            'Base58-encoded minter keypair secret key (for server-side signing)',
    })
    @IsString()
    minterKeypair: string;
}
