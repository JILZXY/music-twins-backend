import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import { GlobalExceptionFilter } from './shared/presentation/filters/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(helmet());
  app.use(cookieParser());

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
  if (!allowedOrigins.includes('http://localhost:3000')) {
    allowedOrigins.push('http://localhost:3000');
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('MusicTwins API')
    .setDescription('The MusicTwins API documentation')
    .setVersion('1.0')
    .addCookieAuth('jwt') // Assumes JWT is sent via cookie
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Forzamos la escucha en 0.0.0.0 para que Docker pueda rutear el tráfico correctamente
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}/api/v1`);
  console.log(
    `Swagger documentation is available at: http://0.0.0.0:${port}/api/docs`,
  );
}

bootstrap();
