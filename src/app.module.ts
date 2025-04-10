import generalConfig from '@core/configs/general.config';
import databaseConfig from '@core/configs/postgres-database.config';
import { DatabaseError } from '@core/errors/infrastructure.error';
import { AuthenticateGuard } from '@core/features/auth/authenticate.guard';
import { ClientModule } from '@core/features/client/client.module';
import { GlobalExceptionFilter } from '@core/filters/global-exception.filter';
import { TransformInterceptor } from '@core/interceptors/transform.interceptor';
import { ProviderModule } from '@modules/provider/provider.module';
import { UserModule } from '@modules/user/user.module';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';

const featuredModules = [ProviderModule, UserModule] as unknown as DynamicModule[];

@Module({
    imports: [
        ClientModule.registerAsync(),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig, generalConfig],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const generalConfig: Record<string, any> | undefined = configService.get('general');
                const databaseConfig: TypeOrmModuleOptions | undefined = configService.get('database');
                const environment: string = String(generalConfig?.environment) || 'local';

                if (!databaseConfig) {
                    throw DatabaseError('Database config not found');
                }

                return {
                    ...databaseConfig,
                    logging: environment === 'local',
                };
            },
        }),
        ...featuredModules,
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
        {
            provide: APP_GUARD,
            useClass: AuthenticateGuard,
        },
    ],
})
export class AppModule {}
