import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiModule } from './api.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);

  // Global validation — rejects malformed DTOs automatically
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Enable CORS
  app.enableCors();

  // Swagger auto-generated API docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SSS Token API')
    .setDescription(
      'Solana Stablecoin Standard — Backend Service API.\n\n' +
        'Provides endpoints for token lifecycle (mint/burn), compliance operations ' +
        '(blacklist/seize), audit logging, and webhook management.',
    )
    .setVersion('1.0')
    .addTag('Health', 'Service health checks')
    .addTag('Token', 'Mint, burn, and supply operations')
    .addTag(
      'Compliance',
      'SSS-2 blacklist and seizure operations (requires SSS-2 token)',
    )
    .addTag('Audit', 'Immutable audit log and CSV export')
    .addTag('Webhooks', 'Webhook subscription management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 SSS API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at  http://localhost:${port}/docs`);
}
bootstrap();
