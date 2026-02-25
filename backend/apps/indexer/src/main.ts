import { NestFactory } from '@nestjs/core';
import { IndexerModule } from './indexer.module';

async function bootstrap() {
  const app = await NestFactory.create(IndexerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
