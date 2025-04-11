import { User } from '@core/features/user/user.entity';
import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Inject, Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../ports/user-repository.out.port';
import { USER_TOKENS } from '../user.token';

export class UserDetailQuery {
    constructor(public readonly payload: { id: string }) {}
}

@Injectable()
@QueryHandler(UserDetailQuery)
export class DetailUserQueryHandler implements IQueryHandler<UserDetailQuery, User> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(query: UserDetailQuery): Promise<User> {
        const { id } = query.payload;
        const { success, error } = DetailQuerySchema.safeParse({ id });
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        const user = await this.userRepository.findById(id);
        if (!user) throw NotFoundError(`User with id ${id} not found.`, { layer: ErrorLayer.APPLICATION });

        return user;
    }
}
