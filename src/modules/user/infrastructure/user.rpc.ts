import { AuthenticateUserAction } from '@core/features/auth/authenticate.action';
import { User } from '@core/features/user/user.entity';
import { RpcExceptionFilter } from '@core/filters/rpc-exception.filter';
import { Email, Id } from '@core/types/common.type';
import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserCreateDto } from '../application/user.dto';
import { CreateUserCommand } from '../application/commands/create-user.command';
import { UserDetailQuery } from '../application/queries/detail-user.query';
import { GetUserByConditionQuery } from '../application/queries/detail-user-by-condition.query';

@Controller()
@UseFilters(RpcExceptionFilter)
export class UserRpcController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @MessagePattern(AuthenticateUserAction.VALIDATE)
    async validateUser(user: User): Promise<User> {
        return await this.queryBus.execute<UserDetailQuery, User>(new UserDetailQuery({ id: user.id }));
    }

    @MessagePattern(AuthenticateUserAction.GET)
    async getUser(payload: { userId: Id }): Promise<User> {
        return await this.queryBus.execute<UserDetailQuery, User>(new UserDetailQuery({ id: payload.userId }));
    }

    @MessagePattern(AuthenticateUserAction.CREATE)
    async createUser(payload: { dto: UserCreateDto; createdById?: string }): Promise<Id> {
        return await this.commandBus.execute<CreateUserCommand, Id>(new CreateUserCommand(payload));
    }

    @MessagePattern(AuthenticateUserAction.GET_BY_EMAIL)
    async getByEmail(email: Email): Promise<User | null> {
        return await this.queryBus.execute<GetUserByConditionQuery, User | null>(
            new GetUserByConditionQuery({ condition: { email } }),
        );
    }

    // @MessagePattern(AuthenticateUserAction.GET_PASSWORD)
    // async getPassword(id: Id) {
    //     return await this.service.getPassword(id);
    // }
}
