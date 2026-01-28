import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import multipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 50 * 1024 * 1024 }),
  );
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  await app.register(multipart);
  app.use(helmet());
  app.enableCors();
  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 StreamForge Engine running on: ${await app.getUrl()}`);
}
void bootstrap();
