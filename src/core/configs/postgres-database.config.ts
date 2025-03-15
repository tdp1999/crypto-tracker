import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => {
    console.log('is this running:', process.env.DB_URL);
    return {
        type: 'postgres',
        url: process.env.DB_URL,
        synchronize: false,
        logging: false,
        ssl: { rejectUnauthorized: false },

        autoLoadEntities: true,
    };
});
