import { IJwtData } from '@core/features/auth/authenticate.type';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AUTH_TOKEN } from '../auth.token';
import { IJwtService } from '../ports/auth-jwt.port';

export class VerifyQuery {
    constructor(public readonly payload: { token: string }) {}
}

@Injectable()
@QueryHandler(VerifyQuery)
export class VerifyQueryHandler implements IQueryHandler<VerifyQuery, IJwtData> {
    constructor(@Inject(AUTH_TOKEN.JWT_SERVICE) private readonly jwtService: IJwtService) {}

    async execute(query: VerifyQuery): Promise<IJwtData> {
        return await this.jwtService.verify(query.payload.token);
    }
}
