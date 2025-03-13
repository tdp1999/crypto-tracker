/* eslint-disable @typescript-eslint/no-require-imports */
import { getEntityPaths, getMigrationPaths } from '@shared/utils/path.util';
import { DataSource } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
require('dotenv').config();

export default new DataSource({
    type: 'postgres',
    url: process.env.DB_URL,

    synchronize: false,
    logging: false,
    logger: 'advanced-console',

    entities: getEntityPaths(process.env.TYPEORM_ENTITIES),
    migrations: getMigrationPaths(process.env.TYPEORM_MIGRATIONS),
    migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
});
