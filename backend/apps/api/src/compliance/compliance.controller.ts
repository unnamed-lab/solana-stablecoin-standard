import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { BlacklistDto, CheckWalletBlacklistDto } from './dto/blacklist.dto';
import { SeizeDto } from './dto/seize.dto';

@ApiTags('Compliance')
@Controller('api/v1')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('blacklist')
  @HttpCode(200)
  @ApiOperation({ summary: 'Add a wallet address to the blacklist (SSS-2)' })
  @ApiResponse({
    status: 200,
    description: 'Address blacklisted and token account frozen',
  })
  async blacklistAdd(@Body() dto: BlacklistDto) {
    return this.complianceService.blacklistAdd(dto);
  }

  @Delete('blacklist/:address')
  @ApiOperation({
    summary: 'Remove a wallet address from the blacklist (SSS-2)',
  })
  @ApiResponse({
    status: 200,
    description: 'Address removed from blacklist and token account thawed',
  })
  async blacklistRemove(
    @Param('address') address: string,
    @Query('blacklisterKeypair') blacklisterKeypair: string,
  ) {
    return this.complianceService.blacklistRemove(address, blacklisterKeypair);
  }

  @Get('blacklist')
  @ApiOperation({ summary: 'Get the active blacklist' })
  @ApiQuery({
    name: 'mint',
    required: false,
    description: 'Filter by mint address',
  })
  @ApiResponse({ status: 200, description: 'List of active blacklist entries' })
  async getBlacklist(@Query('mint') mint?: string) {
    return this.complianceService.getBlacklist(mint);
  }

  @Get('blacklist/check/:address')
  @ApiOperation({ summary: 'Check if an address is blacklisted' })
  @ApiResponse({
    status: 200,
    schema: {
      properties: { blacklisted: { type: 'boolean', example: true } },
    },
  })
  async isBlacklisted(
    @Param('address') address: string,
    @Query() queryDto?: CheckWalletBlacklistDto,
  ) {
    const blacklisted = await this.complianceService.isBlacklisted(
      address,
      queryDto?.mint,
    );
    return { blacklisted };
  }

  @Post('seize')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Seize tokens from a frozen account (SSS-2, requires permanent delegate)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens seized and transferred',
  })
  async seize(@Body() dto: SeizeDto) {
    return this.complianceService.seize(dto);
  }
}
