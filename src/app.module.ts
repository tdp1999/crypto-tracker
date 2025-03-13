import generalConfig from '@core/configs/general.config';
import databaseConfig from '@core/configs/postgres-database.config';
import { DatabaseError } from '@core/errors/infrastructure.error';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { TestEntity } from './modules/test/test.entity';
import { TestModule } from './modules/test/test.module';

const featuredModules = [TestModule];

@Module({
    imports: [
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
        TypeOrmModule.forFeature([TestEntity]),
        ...featuredModules,
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule {}
