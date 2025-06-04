import generalConfig from '@core/configs/general.config';
import databaseConfig from '@core/configs/postgres-database.config';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserPersistence } from '@modules/user/infrastructure/user.persistence';
import { SeedPersistence } from './seed.persistence';
import { SeedService } from './seed.service';
import { UserSeeder } from './seeders/user.seeder';

const seeder = [UserSeeder];

@Module({
    providers: [Logger, SeedService, ...seeder],
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
        TypeOrmModule.forFeature([SeedPersistence, UserPersistence]),
    ],
})
export class SeedModule {}
