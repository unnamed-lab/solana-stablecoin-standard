import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { OracleModule } from './oracle.module';
import { ResponseInterceptor } from './common/response.interceptor';
import { SssExceptionFilter } from './common/sss-exception.filter';

// Prisma returns BigInt for fields like amount, onChainTimestamp, etc.
// JSON.stringify cannot serialise BigInt natively, so convert to string.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(OracleModule);

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
    .setTitle('SSS Oracle API')
    .setDescription(
      'Solana Stablecoin Standard — Oracle Backend Service API.\n\n' +
      'Provides endpoints for interacting with the SSS Oracle program: listing price feeds, fetching config, and simulating math-only price quotes (USD to token and vice versa).',
    )
    .setVersion('1.0')
    .addTag('Health', 'Service health checks')
    .addTag('Feeds', 'Listing and registering Switchboard price feeds')
    .addTag('Config', 'Oracle configuration for standard mints')
    .addTag('Quotes', 'Math-only price simulations for frontend clients')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Oracle typically runs on a different port than the main API (4000)
  const port = process.env.ORACLE_PORT ?? 4001;
  await app.listen(port);

  console.log(`🚀 SSS Oracle Backend running on http://localhost:${port}`);
  console.log(`📚 Oracle Swagger docs at  http://localhost:${port}/docs`);
}
bootstrap();
