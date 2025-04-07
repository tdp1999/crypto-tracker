import { User, UserCreateSchema } from '@core/domain/entities/user.entity';
import { BadRequestError } from '@core/errors/domain.error';
import { Inject } from '@nestjs/common';
import { ICommandHandler } from '@shared/types/cqrs.type';
import { IUserRepository } from '../ports/user-repository.out.port';
import { UserCreateCommand } from '../user.dto';
import { USER_TOKENS } from '../user.token';

export class CreateUserCommand implements ICommandHandler<UserCreateCommand, string> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(command: UserCreateCommand) {
        const { success, data, error } = UserCreateSchema.safeParse(command.dto);
        if (!success) throw BadRequestError(error, { layer: 'application', remarks: 'User creation failed' });

        const isEmailExists = await this.userRepository.findOne({ where: { email: data.email } });
        if (isEmailExists)
            throw BadRequestError('Email already exists', { layer: 'application', remarks: 'User creation failed' });

        const user = await User.create(data, command.createdById);
        return this.userRepository.add(user);
    }
}
