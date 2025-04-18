import { AuthenticateUserAction } from '@core/features/auth/authenticate.action';
import { User } from '@core/features/user/user.entity';
import { UserCredentialValidityResult } from '@core/features/user/user.type';
import { RpcExceptionFilter } from '@core/filters/rpc-exception.filter';
import { Email, Id } from '@core/types/common.type';
import { Controller, UseFilters } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { MessagePattern } from '@nestjs/microservices';
import { CreateUserCommand } from '../application/commands/create-user.command';
import { CredentialValidityQuery } from '../application/queries/credential-validity.query';
import { UserDetailQuery } from '../application/queries/detail-user.query';
import { UserCreateDto } from '../application/user.dto';

@Controller()
@UseFilters(RpcExceptionFilter)
export class UserRpcController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @MessagePattern(AuthenticateUserAction.CREATE)
    async createUser(payload: { dto: UserCreateDto; createdById?: string }): Promise<Id> {
        return await this.commandBus.execute<CreateUserCommand, Id>(new CreateUserCommand(payload));
    }

    @MessagePattern(AuthenticateUserAction.GET)
    async getUser(payload: { userId: Id }): Promise<User> {
        return await this.queryBus.execute<UserDetailQuery, User>(new UserDetailQuery({ id: payload.userId }));
    }

    @MessagePattern(AuthenticateUserAction.VALIDATE)
    async validateUser(user: User): Promise<User> {
        return await this.queryBus.execute<UserDetailQuery, User>(new UserDetailQuery({ id: user.id }));
    }

    @MessagePattern(AuthenticateUserAction.VALIDATE_CREDENTIAL)
    async validateCredential(payload: { email: Email; password: string }): Promise<UserCredentialValidityResult> {
        return await this.queryBus.execute<CredentialValidityQuery, UserCredentialValidityResult>(
            new CredentialValidityQuery(payload),
        );
    }
}
