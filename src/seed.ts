import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from '@core/features/seed/seed.module';
import { SeedService } from '@core/features/seed/seed.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(SeedModule);
    const logger = app.get(Logger);
    const seeder = app.get(SeedService);

    try {
        await seeder.runSeeds();
        logger.debug('Seeding complete!');
    } catch (error) {
        logger.error('Seeding failed!');
        throw error;
    } finally {
        await app.close();
    }
}

bootstrap()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
