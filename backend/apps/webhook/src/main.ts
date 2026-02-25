import { NestFactory } from '@nestjs/core';
import { WebhookModule } from './webhook.module';

async function bootstrap() {
  const app = await NestFactory.create(WebhookModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
