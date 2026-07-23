import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Necesario para que req.protocol/req.hostname reflejen la URL pública real detrás
  // del proxy de Railway — sin esto, la validación de firma del webhook de Twilio falla
  // porque construiría la URL como http:// en vez de https://.
  app.set('trust proxy', 1);

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(
  process.env.PORT ?? process.env.API_PORT ?? 3000,
);

await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`API corriendo en http://localhost:${port}`);
}
bootstrap();
