import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiModule } from './api.module';
import { ResponseInterceptor } from './common/response.interceptor';
import { SssExceptionFilter } from './common/sss-exception.filter';

// Prisma returns BigInt for fields like amount, onChainTimestamp, etc.
// JSON.stringify cannot serialise BigInt natively, so convert to string.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);

  // Global validation — rejects malformed DTOs automatically
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Standard API response envelope + SDK error handling
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new SssExceptionFilter());

  // CORS — restrict to allowed origins (env-driven)
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((o) =>
    o.trim(),
  ) ?? ['http://localhost:3000', 'http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 3600,
  });

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

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`🚀 SSS API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at  http://localhost:${port}/docs`);
}
bootstrap();
