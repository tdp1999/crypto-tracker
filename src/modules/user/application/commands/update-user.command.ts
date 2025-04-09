import { UserUpdateSchema } from '@core/domain/entities/user.entity';
import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Inject, Injectable } from '@nestjs/common';
import { ICommandHandler } from '@shared/types/cqrs.type';
import { IUserRepository } from '../ports/user-repository.out.port';
import { UserUpdateCommand } from '../user.dto';
import { USER_TOKENS } from '../user.token';

@Injectable()
export class UpdateUserCommand implements ICommandHandler<UserUpdateCommand, boolean> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(command: UserUpdateCommand): Promise<boolean> {
        const { success, error, data: validatedDto } = UserUpdateSchema.safeParse(command.dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        const { id } = command;
        const exists = await this.userRepository.exists(id);
        if (!exists) throw NotFoundError(`User with id ${id} not found.`, { layer: ErrorLayer.APPLICATION });

        return this.userRepository.update(id, validatedDto);
    }
}
