import { NestFactory } from '@nestjs/core';
import { WebhookModule } from './webhook.module';

async function bootstrap() {
  // No HTTP adapter — pure BullMQ worker
  const app = await NestFactory.createApplicationContext(WebhookModule);

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n🛑 Received ${signal}, shutting down webhook worker...`);
      await app.close();
      process.exit(0);
    });
  }

  console.log('📡 SSS Webhook worker started — processing delivery queue');
}
bootstrap();
