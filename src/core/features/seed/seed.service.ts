import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { BooleanValue } from '@shared/vos/boolean.value';
import { Repository } from 'typeorm';
import { ISeed } from './seed.interface';
import { SeedPersistence } from './seed.persistence';
import { UserSeeder } from './seeders/user.seeder';
@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @Inject(ConfigService) private configService: ConfigService,
        @InjectRepository(SeedPersistence) private seedRepository: Repository<SeedPersistence>,

        // Seeders
        private userSeeder: UserSeeder,
    ) {}

    async runSeeds() {
        if (!this.isSeedingEnabled()) {
            this.logger.debug('Seeding is disabled');
            return;
        }

        const seeders: { name: string; seeder: ISeed }[] = [{ name: 'Default User', seeder: this.userSeeder }];

        for (const seederInfo of seeders) {
            await this.processSingleSeeder(seederInfo);
        }
    }

    private isSeedingEnabled(): boolean {
        return BooleanValue.toBoolean(this.configService.get<boolean>('general.seedingEnabled'));
    }

    private async processSingleSeeder({ name, seeder }: { name: string; seeder: ISeed }): Promise<void> {
        const existingSeed = await this.seedRepository.findOne({ where: { name } });

        if (!existingSeed || !existingSeed.isCompleted) {
            await this.executeSeeder(name, seeder);
            return;
        }

        this.logger.debug(`Skipping ${name} seeder first time as it's already executed`);
        await this.handleRerun(name, seeder, existingSeed.id);
    }

    private async executeSeeder(name: string, seeder: ISeed): Promise<void> {
        try {
            this.logger.log(`Running ${name} seeder...`);
            await seeder.seed();
            await this.seedRepository.save({ name, isCompleted: true, executedAt: BigInt(Date.now()) });
            this.logger.log(`${name} seeder completed successfully`);
        } catch (error) {
            this.logger.error(`Error running ${name} seeder`, error);
            throw error;
        }
    }

    private async handleRerun(name: string, seeder: ISeed, seedId: number | string): Promise<void> {
        if (seeder.rerun && typeof seeder.rerun === 'function') {
            try {
                this.logger.log(`Re-running ${name} seeder...`);
                await seeder.rerun();
                await this.seedRepository.update(seedId, { executedAt: BigInt(Date.now()) });
                this.logger.log(`${name} seeder re-run completed successfully`);
            } catch (error) {
                this.logger.error(`Error re-running ${name} seeder`, error);
                throw error;
            }
        }
    }
}
