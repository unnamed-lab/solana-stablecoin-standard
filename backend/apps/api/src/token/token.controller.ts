import { Controller, Post, Get, Body, HttpCode, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TokenService } from './token.service';
import { MintDto } from './dto/mint.dto';
import { BurnDto } from './dto/burn.dto';

@ApiTags('Token')
@Controller('api/v1')
export class TokenController {
  constructor(private readonly tokenService: TokenService) { }

  @Post('mint')
  @HttpCode(200)
  @Throttle({ strict: { ttl: 60000, limit: 10 } })
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
  @Throttle({ strict: { ttl: 60000, limit: 10 } })
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
  @ApiOperation({ summary: 'Get current total supply, max supply, and burn supply' })
  @ApiResponse({
    status: 200,
    description: 'Current supply info',
    schema: {
      properties: {
        totalSupply: { type: 'string', example: '1000000000' },
        maxSupply: { type: 'string', nullable: true, example: null },
        burnSupply: { type: 'string', example: '50000' },
        decimals: { type: 'number', example: 6 },
      },
    },
  })
  async getSupply() {
    return this.tokenService.getSupply();
  }

  @Get('holders/count')
  @ApiOperation({ summary: 'Get total number of token holders' })
  @ApiResponse({
    status: 200,
    description: 'Total token holders count',
    schema: {
      properties: {
        count: { type: 'number', example: 1500 },
      },
    },
  })
  async getHoldersCount() {
    return this.tokenService.getHoldersCount();
  }

  @Get('holders/largest')
  @ApiOperation({ summary: 'Get the largest token holders (can filter by minimum amount)' })
  @ApiResponse({
    status: 200,
    description: 'Largest token holders list',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'string', example: 'TokenAccountAddress...' },
          amount: { type: 'string', example: '1000000' },
          decimals: { type: 'number', example: 6 },
          uiAmount: { type: 'number', example: 1 },
          uiAmountString: { type: 'string', example: '1' },
        }
      }
    },
  })
  async getLargestHolders(@Query('minAmount') minAmount?: string) {
    const min = minAmount ? Number(minAmount) : undefined;
    return this.tokenService.getLargestHolders(min);
  }

  @Get('info')
  @ApiOperation({ summary: 'Get basic stablecoin information (name, symbol, supply, etc.)' })
  @ApiResponse({
    status: 200,
    description: 'Stablecoin information',
  })
  async getInfo() {
    return this.tokenService.getInfo();
  }

  @Get('minters')
  @ApiOperation({ summary: 'Get the list of active minters and their quotas for the token' })
  @ApiResponse({
    status: 200,
    description: 'List of minters',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pubkey: { type: 'string', example: 'TokenAccountAddress...' },
        }
      }
    },
  })
  async getMintersList() {
    return this.tokenService.getMintersList();
  }
}
