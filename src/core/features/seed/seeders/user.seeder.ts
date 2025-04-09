import { USER_STATUS } from '@core/domain/entities/user.entity';
import { UserEntity } from '@modules/user/infrastructure/user.persistence';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hashByBcrypt } from '@shared/utils/hash.util';
import { Repository } from 'typeorm';
import { v7 } from 'uuid';
import { ISeed } from '../seed.interface';

@Injectable()
export class UserSeeder implements ISeed {
    constructor(
        @Inject(ConfigService) private readonly config: ConfigService,
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    ) {}

    async seed(): Promise<void> {
        const email = this.config.get<string>('general.defaultAdminEmail');
        const password = this.config.get<string>('general.defaultAdminPassword');
        const systemId = this.config.get<string>('general.defaultSystemId');

        if (!email || !password || !systemId) {
            throw new Error('Missing required configuration values');
        }

        const hashedPassword = await hashByBcrypt(password);
        const currentTimestamp = BigInt(Date.now());
        const user = this.userRepository.create({
            id: v7(),
            email,
            salt: '',
            password: hashedPassword,
            status: USER_STATUS.ACTIVE,
            isSystem: true,
            createdAt: currentTimestamp,
            createdById: systemId,
            updatedAt: currentTimestamp,
            updatedById: systemId,
        });

        await this.userRepository.save(user);
    }
}
