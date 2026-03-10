import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export interface ConfigDto {
  network: string;
  rpcEndpoint: string;
}

@ApiTags('Config')
@Controller('api/v1/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get backend runtime config (network, RPC)' })
  @ApiResponse({ status: 200, description: 'Config for display in frontend' })
  getConfig(): ConfigDto {
    const network =
      this.configService.get<string>('SOLANA_NETWORK', 'devnet') || 'devnet';
    const rpcUrl =
      this.configService.get<string>(
        'RPC_URL',
        'https://api.devnet.solana.com',
      ) || 'https://api.devnet.solana.com';

    let rpcEndpoint: string;
    try {
      rpcEndpoint = new URL(rpcUrl).host;
    } catch {
      rpcEndpoint = rpcUrl;
    }

    const displayNetwork = network
      .split('-')
      .map((s) => s.toUpperCase())
      .join('-');

    return {
      network: displayNetwork,
      rpcEndpoint,
    };
  }
}
