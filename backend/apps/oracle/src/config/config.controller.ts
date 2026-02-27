import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { InitializeConfigDto } from './dto/initialize-config.dto';

@ApiTags('Config')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get(':mint')
  @ApiOperation({ summary: 'Get Oracle configuration for a specific mint' })
  @ApiParam({ name: 'mint', description: 'Base58 string of the mint address' })
  @ApiResponse({ status: 200, description: 'Oracle info returned.' })
  async getOracleInfo(@Param('mint') mint: string) {
    return this.configService.getOracleInfo(mint);
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize Oracle configuration for a mint (Admin only)' })
  @ApiResponse({ status: 201, description: 'Oracle configuration initialized successfully.' })
  async initializeOracle(@Body() dto: InitializeConfigDto) {
    return this.configService.initializeOracle(dto);
  }
}
