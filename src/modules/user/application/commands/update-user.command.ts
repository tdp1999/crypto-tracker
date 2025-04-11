import { UserUpdateSchema } from '@core/features/user/user.entity';
import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '../ports/user-repository.out.port';
import { UserUpdateDto } from '../user.dto';
import { USER_TOKENS } from '../user.token';

// Command class
export class UpdateUserCommand {
    constructor(
        public readonly payload: {
            id: string;
            dto: UserUpdateDto;
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

        const exists = await this.userRepository.exists(id);
        if (!exists) throw NotFoundError(`User with id ${id} not found.`, { layer: ErrorLayer.APPLICATION });

        // Ensure the validated DTO includes who updated it
        const updateData = { ...validatedDto, updatedById };

        return this.userRepository.update(id, updateData);
    }
}
