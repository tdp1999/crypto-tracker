import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../ports/user-repository.out.port';
import { USER_TOKENS } from '../user.token';

// Command class
export class DeleteUserCommand {
    constructor(public readonly payload: { id: string; deletedById: string }) {}
}

@Injectable()
@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler implements ICommandHandler<DeleteUserCommand, boolean> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(command: DeleteUserCommand): Promise<boolean> {
        const { id } = command.payload;
        const { success, error } = DetailQuerySchema.safeParse({ id });
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        const exists = await this.userRepository.exists(id);
        if (!exists) throw NotFoundError(`User with id ${id} not found.`, { layer: ErrorLayer.APPLICATION });

        // Using deletedById to mark who deleted the user can be implemented
        // in the repository if needed
        return this.userRepository.remove(id);
    }
}
