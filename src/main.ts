import { globalErrorMap } from '@core/errors/zod.error';
import { NestFactory } from '@nestjs/core';
import { z } from 'zod';
import { AppModule } from './app.module';

z.setErrorMap(globalErrorMap);

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix(process.env.GLOBAL_PREFIX || 'api');

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
