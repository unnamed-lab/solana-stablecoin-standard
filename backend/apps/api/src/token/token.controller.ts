import { Controller, Post, Get, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TokenService } from './token.service';
import { MintDto } from './dto/mint.dto';
import { BurnDto } from './dto/burn.dto';

@ApiTags('Token')
@Controller('api/v1')
export class TokenController {
    constructor(private readonly tokenService: TokenService) { }

    @Post('mint')
    @HttpCode(200)
    @ApiOperation({ summary: 'Mint new stablecoin tokens to a recipient' })
    @ApiResponse({
        status: 200,
        description: 'Tokens minted successfully',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                txSignature: { type: 'string', example: '5Kz7...xYpQ' },
            },
        },
    })
    async mint(@Body() dto: MintDto) {
        return this.tokenService.mint(dto);
    }

    @Post('burn')
    @HttpCode(200)
    @ApiOperation({ summary: 'Burn stablecoin tokens from an account' })
    @ApiResponse({
        status: 200,
        description: 'Tokens burned successfully',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                txSignature: { type: 'string', example: '3wCX...URH8' },
            },
        },
    })
    async burn(@Body() dto: BurnDto) {
        return this.tokenService.burn(dto);
    }

    @Get('supply')
    @ApiOperation({ summary: 'Get current total supply from on-chain state' })
    @ApiResponse({
        status: 200,
        description: 'Current supply info',
        schema: {
            properties: {
                totalSupply: { type: 'string', example: '1000000000' },
                decimals: { type: 'number', example: 6 },
            },
        },
    })
    async getSupply() {
        return this.tokenService.getSupply();
    }
}
