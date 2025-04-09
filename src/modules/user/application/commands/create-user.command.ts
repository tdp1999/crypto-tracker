import { User, UserCreateSchema } from '@core/domain/entities/user.entity';
import { BadRequestError, InternalServerError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Inject } from '@nestjs/common';
import { ICommandHandler } from '@shared/types/cqrs.type';
import { IUserConfig } from '../ports/user-config.out.port';
import { IUserRepository } from '../ports/user-repository.out.port';
import { UserCreateCommand } from '../user.dto';
import { USER_TOKENS } from '../user.token';
export class CreateUserCommand implements ICommandHandler<UserCreateCommand, string> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,

        @Inject(USER_TOKENS.ADAPTERS.CONFIG)
        private readonly config: IUserConfig,
    ) {}

    async execute(command: UserCreateCommand) {
        const { success, data, error } = UserCreateSchema.safeParse(command.dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'User creation failed' });

        const isEmailExists = await this.userRepository.findOne({ email: data.email });

        if (isEmailExists)
            throw BadRequestError('Email already exists', {
                layer: ErrorLayer.APPLICATION,
                remarks: 'User creation failed',
            });

        const systemId = this.config.getSystemId();
        const creatorId = command.createdById ?? systemId;

        if (!creatorId) throw InternalServerError('System ID is not defined', { layer: ErrorLayer.APPLICATION });

        console.log('data', data, creatorId, systemId);

        const user = await User.create(data, creatorId);
        return this.userRepository.add(user);
    }
}
