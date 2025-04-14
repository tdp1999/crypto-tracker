import { ConfigService } from '@nestjs/config';
import { Id } from '@core/types/common.type';
import { IUserConfig } from '../../application/ports/user-config.out.port';
import { Injectable } from '@nestjs/common';
@Injectable()
export class UserConfigAdapter implements IUserConfig {
    constructor(private configService: ConfigService) {}

    getDefaultPassword(): string | undefined {
        return this.configService.get<string>('general.defaultPassword');
    }

    getSystemId(): Id | undefined {
        return this.configService.get<Id>('general.defaultSystemId');
    }

    getDefaultManualRegistrationId(): Id | undefined {
        return this.configService.get<Id>('general.defaultManualRegistrationId');
    }
}
