import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { User, UserUpdateSchema } from '@core/features/user/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../ports/user-repository.out.port';
import { USER_TOKENS } from '../user.token';

// Command class
export class UpdateUserCommand {
    constructor(
        public readonly payload: {
            id: string;
            dto: unknown;
            updatedById: string;
        },
    ) {}
}

@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler implements ICommandHandler<UpdateUserCommand, boolean> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(command: UpdateUserCommand): Promise<boolean> {
        const { id, dto, updatedById } = command.payload;
        const { success, error, data: validatedDto } = UserUpdateSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        // Get existing user
        const existingUser = await this.userRepository.findById(id);
        if (!existingUser) throw NotFoundError(`User with id ${id} not found.`, { layer: ErrorLayer.APPLICATION });

        // Create updated user entity with domain logic
        const updatedUserData = { ...existingUser, ...validatedDto };
        const updatedUser = User.update(updatedUserData, updatedById);

        // Pass full entity directly to repository
        return this.userRepository.update(id, updatedUser);
    }
}
