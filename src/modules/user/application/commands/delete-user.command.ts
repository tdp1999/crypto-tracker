import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Inject, Injectable } from '@nestjs/common';
import { ICommandHandler } from '@shared/types/cqrs.type';
import { IUserRepository } from '../ports/user-repository.out.port';
import { UserDeleteCommand } from '../user.dto';
import { USER_TOKENS } from '../user.token';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
@Injectable()
export class DeleteUserCommand implements ICommandHandler<UserDeleteCommand, boolean> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(command: UserDeleteCommand): Promise<boolean> {
        const { success, error, data } = DetailQuerySchema.safeParse(command);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        const { id } = data;
        const exists = await this.userRepository.exists(id);
        if (!exists) throw NotFoundError(`User with id ${id} not found.`, { layer: ErrorLayer.APPLICATION });

        return this.userRepository.remove(id);
    }
}
