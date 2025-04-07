import { User } from '@core/domain/entities/user.entity';
import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler } from '@shared/types/cqrs.type';
import { IUserRepository } from '../ports/user-repository.out.port';
import { UserDetailQuery } from '../user.dto';
import { USER_TOKENS } from '../user.token';

@Injectable()
export class DetailUserQuery implements IQueryHandler<UserDetailQuery, User> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(query: UserDetailQuery): Promise<User> {
        const { success, error, data } = DetailQuerySchema.safeParse(query);
        if (!success) throw BadRequestError(error, { layer: 'application' });

        const { id } = data;
        const user = await this.userRepository.findById(id);
        if (!user) throw NotFoundError(`User with id ${id} not found.`, { layer: 'application' });

        return user;
    }
}
