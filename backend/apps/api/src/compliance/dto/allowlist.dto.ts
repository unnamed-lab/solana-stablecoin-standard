import { ApiProperty } from '@nestjs/swagger';
import { AllowlistOps, KycTier } from '@stbr/sss-token';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsEnum,
} from 'class-validator';

export class AllowlistAddDto {
    @ApiProperty({
        description: 'The wallet address to allowlist',
        example: '5YGvg...',
    })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({
        description: 'Allowed operations (1=Receive, 2=Send, 3=Both)',
        enum: AllowlistOps,
        example: 3,
    })
    @IsEnum(AllowlistOps)
    @IsNotEmpty()
    allowedOperations: AllowlistOps;

    @ApiProperty({
        description: 'KYC tier (0=Basic, 1=Enhanced, 2=Institutional)',
        enum: KycTier,
        example: 1,
    })
    @IsEnum(KycTier)
    @IsNotEmpty()
    kycTier: KycTier;

    @ApiProperty({
        description: 'Optional Unix timestamp for when the allowlist expires',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    expiry?: number;

    @ApiProperty({ description: 'Reason for allowing the address' })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiProperty({ description: 'Base58 secret key of the allowlister' })
    @IsString()
    @IsNotEmpty()
    allowlisterKeypair: string;
}

export class CheckWalletAllowlistDto {
    @ApiProperty({
        description: 'Optional mint address. Uses default if omitted.',
        required: false,
    })
    @IsString()
    @IsOptional()
    mint?: string;

    @ApiProperty({
        description: 'Operation to check for (1=Receive, 2=Send, 3=Both)',
        enum: AllowlistOps,
        required: true,
    })
    @IsEnum(AllowlistOps)
    @IsNotEmpty()
    operation: AllowlistOps;
}
