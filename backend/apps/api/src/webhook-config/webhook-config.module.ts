import { Module } from '@nestjs/common';
import { WebhookConfigController } from './webhook-config.controller';
import { WebhookConfigService } from './webhook-config.service';

@Module({
    controllers: [WebhookConfigController],
    providers: [WebhookConfigService],
})
export class WebhookConfigModule { }
