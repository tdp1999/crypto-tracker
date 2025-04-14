import { IUser } from '@core/features/user/user.entity';
import { UserCredentialValidityResult, UserValidityResult } from '@core/features/user/user.type';
import { Email, Id } from '@core/types/common.type';

export interface IAuthRepository {
    create(payload: unknown): Promise<Id>;

    get(userId: Id): Promise<IUser | null>;

    getUserValidity(user: IUser): Promise<UserValidityResult>;

    validateCredential(email: Email, password: string): Promise<UserCredentialValidityResult>;
}
