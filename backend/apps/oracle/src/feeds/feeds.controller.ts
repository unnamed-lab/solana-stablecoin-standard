import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeedsService } from './feeds.service';
import { RegisterFeedDto } from './dto/register-feed.dto';

@ApiTags('Feeds')
@Controller('feeds')
export class FeedsController {
  constructor(private readonly feedsService: FeedsService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered Switchboard price feeds' })
  @ApiResponse({ status: 200, description: 'Return a list of active feeds.' })
  async listFeeds() {
    return this.feedsService.listFeeds();
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new price feed (Admin only)' })
  @ApiResponse({ status: 201, description: 'Feed registered successfully.' })
  async registerFeed(@Body() dto: RegisterFeedDto) {
    return this.feedsService.registerFeed(dto);
  }
}
