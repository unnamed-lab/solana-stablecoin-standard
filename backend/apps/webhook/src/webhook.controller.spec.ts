import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

describe('WebhookController', () => {
  let webhookController: WebhookController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [WebhookService],
    }).compile();

    webhookController = app.get<WebhookController>(WebhookController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(webhookController.getHello()).toBe('Hello World!');
    });
  });
});
