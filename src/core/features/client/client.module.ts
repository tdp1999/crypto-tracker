import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { CLIENT_PROXY } from './client.token';

@Module({})
export class ClientModule {
    static registerAsync(): DynamicModule {
        return ClientsModule.registerAsync([
            {
                name: CLIENT_PROXY,
                inject: [ConfigService],
                imports: [ConfigModule],
                useFactory: (configService: ConfigService) => ({
                    options: {
                        port: configService.get<number>('general.transportPort'),
                    },
                }),
            },
        ]);
    }
}
