import { Id } from '@core/types/common.type';

export interface IUserConfig {
    getDefaultPassword(): string | undefined;

    getSystemId(): Id | undefined;

    getDefaultManualRegistrationId(): Id | undefined;
}
