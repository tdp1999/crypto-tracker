import generalConfig from '@core/configs/general.config';
import databaseConfig from '@core/configs/postgres-database.config';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SeedEntity } from './seed.persistence';
import { SeedService } from './seed.service';

// const seeder = [UserSeeder, PermissionSeeder];

@Module({
    providers: [Logger, SeedService],
    imports: [
        ConfigModule,
        ConfigModule.forRoot({ load: [databaseConfig, generalConfig] }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const config = configService.get<TypeOrmModuleOptions>('database');
                const environment = configService.get<string>('general.environment') || 'local';

                if (!config) throw new Error('Database configuration not found');

                return { ...config, logging: environment === 'local' };
            },
        }),
        TypeOrmModule.forFeature([SeedEntity]),
    ],
})
export class SeedModule {}
