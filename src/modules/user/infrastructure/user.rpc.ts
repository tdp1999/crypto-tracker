import { User } from '@core/features/user/user.entity';
import { AuthenticateUserAction } from '@core/features/auth/authenticate.action';
import { RpcExceptionFilter } from '@core/filters/rpc-exception.filter';
import { Id } from '@core/types/common.type';
import { Controller, Inject, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { IQueryHandler } from '@shared/types/cqrs.type';
import { UserDetailQuery } from '../application/user.dto';
import { USER_TOKENS } from '../application/user.token';

@Controller()
@UseFilters(RpcExceptionFilter)
export class UserRpcController {
    constructor(
        @Inject(USER_TOKENS.HANDLERS.QUERY.DETAIL)
        private readonly userDetailQueryHandler: IQueryHandler<UserDetailQuery, User>,
    ) {}

    @MessagePattern(AuthenticateUserAction.VALIDATE)
    async validateUser(user: User) {
        console.log('user', user);
        return await this.userDetailQueryHandler.execute({ id: user.id });
    }

    @MessagePattern(AuthenticateUserAction.GET)
    async getUser(payload: { userId: Id }) {
        return await this.userDetailQueryHandler.execute({ id: payload.userId });
    }
}
