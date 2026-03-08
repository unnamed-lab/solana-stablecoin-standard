import { IsString, IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ActionParamsDto {
    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    amount?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    to?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    from?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    newMasterAuthority?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    newPauser?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    newMinterAuthority?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    newBurner?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    newBlacklister?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    newSeizer?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    newHookAuthority?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    programId?: string;
}

export class ProposeActionDto {
    @ApiProperty({ description: 'The base58 private key of the proposer (a multisig signer)' })
    @IsString()
    @IsNotEmpty()
    proposerKeypair: string;

    @ApiProperty({ description: 'The type of action to propose', enum: ['MintTo', 'Seize', 'UpdateRoles', 'DelegateToDao'] })
    @IsString()
    @IsIn(['MintTo', 'Seize', 'UpdateRoles', 'DelegateToDao'])
    actionType: string;

    @ApiProperty({ description: 'Parameters for the action' })
    @ValidateNested()
    @Type(() => ActionParamsDto)
    params: ActionParamsDto;
}

export class ApproveProposalDto {
    @ApiProperty({ description: 'The base58 private key of the approver (a multisig signer)' })
    @IsString()
    @IsNotEmpty()
    signerKeypair: string;
}
