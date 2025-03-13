import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
    'database',
    (): TypeOrmModuleOptions => ({
        type: 'postgres',
        url: process.env.DB_URL,
        synchronize: false,
        logging: false,
        ssl: { rejectUnauthorized: false },

        autoLoadEntities: true,
    }),
);
