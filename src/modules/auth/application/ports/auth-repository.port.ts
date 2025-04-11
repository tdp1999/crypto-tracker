import { IUser } from '@core/features/user/user.entity';
import { UserValidityResult } from '@core/features/user/user.type';
import { Email, Id } from '@core/types/common.type';
import { AuthChangePasswordDto, AuthUserCreateDto } from '../auth.dto';

export interface IAuthUserRepository {
    create(payload: AuthUserCreateDto, user?: IUser): Promise<Id>;

    get(userId: Id): Promise<IUser | null>;

    getByEmail(email: Email): Promise<IUser | null>;

    getUserValidity(user: IUser): Promise<UserValidityResult>;

    getPassword(userId: Id): Promise<string>;

    changePassword(userId: Id, payload: AuthChangePasswordDto): Promise<boolean>;
}
