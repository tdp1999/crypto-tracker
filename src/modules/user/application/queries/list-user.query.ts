import { User } from '@core/domain/entities/user.entity';
import { BadRequestError } from '@core/errors/domain.error';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler } from '@shared/types/cqrs.type';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { IUserRepository } from '../ports/user-repository.out.port';
import { UserListQuery, UserQuerySchema } from '../user.dto';
import { USER_TOKENS } from '../user.token';

@Injectable()
export class ListUserQuery implements IQueryHandler<UserListQuery, PaginatedResponse<User>> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(query: UserListQuery): Promise<PaginatedResponse<User>> {
        const { success, error, data: validatedDto } = UserQuerySchema.safeParse(query.dto);
        if (!success) throw BadRequestError(error, { layer: 'application' });

        return this.userRepository.paginatedList(validatedDto);
    }
}
