import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { User } from '@core/features/user/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { IUserRepository } from '../ports/user-repository.out.port';
import { UserQuerySchema } from '../user.dto';
import { USER_TOKENS } from '../user.token';

// Query class
export class UserListQuery {
    constructor(public readonly payload: { dto: unknown }) {}
}

@Injectable()
@QueryHandler(UserListQuery)
export class ListUserQueryHandler implements IQueryHandler<UserListQuery, PaginatedResponse<User>> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(query: UserListQuery): Promise<PaginatedResponse<User>> {
        const { dto } = query.payload;
        const { success, error, data: validatedDto } = UserQuerySchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        return this.userRepository.paginatedList(validatedDto);
    }
}
