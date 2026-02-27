import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookConfigService } from './webhook-config.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhookConfigController {
  constructor(private readonly webhookConfigService: WebhookConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new webhook subscription' })
  @ApiResponse({ status: 201, description: 'Webhook created' })
  async create(@Body() dto: CreateWebhookDto) {
    return this.webhookConfigService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all webhook subscriptions' })
  @ApiResponse({ status: 200, description: 'All webhooks' })
  async findAll() {
    return this.webhookConfigService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async findOne(@Param('id') id: string) {
    return this.webhookConfigService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateWebhookDto>,
  ) {
    return this.webhookConfigService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  async remove(@Param('id') id: string) {
    return this.webhookConfigService.remove(id);
  }
}
