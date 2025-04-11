import { AuthenticateAction } from '@core/features/auth/authenticate.action';
import { IJwtData } from '@core/features/auth/authenticate.type';
import { RpcExceptionFilter } from '@core/filters/rpc-exception.filter';
import { Controller, UseFilters } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { MessagePattern } from '@nestjs/microservices';
import { VerifyQuery } from '../application/queries/verify.query';

@Controller()
@UseFilters(RpcExceptionFilter)
export class AuthRpcController {
    constructor(private readonly queryBus: QueryBus) {}

    @MessagePattern(AuthenticateAction.VERIFY)
    async verify(token: string): Promise<IJwtData> {
        return await this.queryBus.execute(new VerifyQuery({ token }));
    }
}
