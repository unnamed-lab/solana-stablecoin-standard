import { NestFactory } from '@nestjs/core';
import { IndexerModule } from './indexer.module';

async function bootstrap() {
  // No HTTP adapter — pure background worker
  const app = await NestFactory.createApplicationContext(IndexerModule);

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n🛑 Received ${signal}, shutting down indexer...`);
      await app.close();
      process.exit(0);
    });
  }

  console.log('🔍 SSS Indexer started — listening for on-chain events');
}
bootstrap();
