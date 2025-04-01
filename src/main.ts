import { globalErrorMap } from '@core/errors/zod.error';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { z } from 'zod';
import { AppModule } from './app.module';

z.setErrorMap(globalErrorMap);

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    const port = configService.get<number>('general.port');
    const globalPrefix = configService.get<string>('general.globalPrefix');
    const transportHost = configService.get<string>('general.transportHost');
    const transportPort = configService.get<number>('general.transportPort');

    app.setGlobalPrefix(globalPrefix || 'api');

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.TCP,
        options: { host: transportHost, port: transportPort },
    });

    await app.startAllMicroservices();
    await app.listen(port ?? 3000);
}

void bootstrap();
