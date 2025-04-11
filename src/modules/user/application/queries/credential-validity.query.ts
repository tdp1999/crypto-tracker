import {
    ERR_USER_INVALID_PASSWORD,
    ERR_USER_INVALID_STATUS,
    ERR_USER_NOT_FOUND,
    ERR_USER_PASSWORD_NOT_PROVIDED,
} from '@core/features/user/user.error';
import { UserCredentialValidityResult, UserValidityResult } from '@core/features/user/user.type';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { compareByBcrypt } from '@shared/utils/hash.util';
import { IUserRepository } from '../ports/user-repository.out.port';
import { USER_TOKENS } from '../user.token';
import { UserValidityQuery } from './user-validity.query';

export class CredentialValidityQuery {
    constructor(public readonly payload: { email: string; password: string }) {}
}

@Injectable()
@QueryHandler(CredentialValidityQuery)
export class CredentialValidityQueryHandler
    implements IQueryHandler<CredentialValidityQuery, UserCredentialValidityResult>
{
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,

        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: CredentialValidityQuery): Promise<UserCredentialValidityResult> {
        const { email, password } = query.payload;

        const existUser = await this.userRepository.findOne({ email });
        if (!existUser) return { isValid: false, invalidMessage: ERR_USER_NOT_FOUND };

        const hashedPassword = await this.userRepository.getHashedPassword(existUser.id);
        if (!hashedPassword) return { isValid: false, invalidMessage: ERR_USER_PASSWORD_NOT_PROVIDED };

        const isPasswordValid = await compareByBcrypt(password, hashedPassword);
        if (!isPasswordValid) return { isValid: false, invalidMessage: ERR_USER_INVALID_PASSWORD };

        const userValidity = await this.queryBus.execute<UserValidityQuery, UserValidityResult>(
            new UserValidityQuery({ user: existUser }),
        );
        if (!userValidity.isValid)
            return { isValid: false, invalidMessage: userValidity.invalidMessage ?? ERR_USER_INVALID_STATUS };

        return { isValid: true, user: existUser };
    }
}
