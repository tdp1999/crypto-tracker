import { User } from '@core/features/user/user.entity';
import { Conditions } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../ports/user-repository.out.port';
import { USER_TOKENS } from '../user.token';

export class GetUserByConditionQuery {
    constructor(public readonly payload: { condition: Conditions }) {}
}

@Injectable()
@QueryHandler(GetUserByConditionQuery)
export class DetailUserByConditionQueryHandler implements IQueryHandler<GetUserByConditionQuery, User | null> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(query: GetUserByConditionQuery): Promise<User | null> {
        const { condition } = query.payload;
        return await this.userRepository.findOne(condition);
    }
}
