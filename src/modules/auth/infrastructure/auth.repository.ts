import { RpcClientRepository } from '@core/decorators/client.rpc.decorator';
import { AuthenticateUserAction } from '@core/features/auth/authenticate.action';
import { CLIENT_PROXY } from '@core/features/client/client.token';
import { IUser } from '@core/features/user/user.entity';
import { UserCredentialValidityResult, UserValidityResult } from '@core/features/user/user.type';
import { Email, Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { axiosObservableToPromise } from '@shared/utils/axios.util';
import { AuthUserCreateDto } from '../application/auth.dto';
import { IAuthRepository } from '../application/ports/auth-repository.port';

@Injectable()
@RpcClientRepository()
export class AuthRepository implements IAuthRepository {
    constructor(@Inject(CLIENT_PROXY) private readonly client: ClientProxy) {}

    async create(payload: AuthUserCreateDto): Promise<Id> {
        return await axiosObservableToPromise(this.client.send(AuthenticateUserAction.CREATE, payload));
    }

    async get(userId: Id): Promise<IUser | null> {
        return await axiosObservableToPromise(
            this.client.send(AuthenticateUserAction.GET, { userId, visibleColumns: [] }),
        );
    }

    async getUserValidity(user: IUser): Promise<UserValidityResult> {
        return await axiosObservableToPromise(this.client.send(AuthenticateUserAction.VALIDATE, user));
    }

    async validateCredential(email: Email, password: string): Promise<UserCredentialValidityResult> {
        return await axiosObservableToPromise(
            this.client.send(AuthenticateUserAction.VALIDATE_CREDENTIAL, { email, password }),
        );
    }
}
