import { BadRequestError, InternalServerError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { User, UserCreateSchema } from '@core/features/user/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserConfig } from '../ports/user-config.out.port';
import { IUserRepository } from '../ports/user-repository.out.port';
import { UserCreateDto } from '../user.dto';
import { USER_TOKENS } from '../user.token';

export class CreateUserCommand {
    constructor(public readonly payload: { dto: UserCreateDto; createdById?: string }) {}
}

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
    constructor(
        @Inject(USER_TOKENS.REPOSITORIES)
        private readonly userRepository: IUserRepository,

        @Inject(USER_TOKENS.ADAPTERS.CONFIG)
        private readonly config: IUserConfig,
    ) {}

    async execute(command: CreateUserCommand) {
        const { dto, createdById } = command.payload;
        const { success, data, error } = UserCreateSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'User creation failed' });

        const isEmailExists = await this.userRepository.findOne({ email: data.email });

        if (isEmailExists)
            throw BadRequestError('Email already exists', {
                layer: ErrorLayer.APPLICATION,
                remarks: 'User creation failed',
            });

        const systemId = this.config.getSystemId();
        const creatorId = createdById ?? systemId;

        if (!creatorId) throw InternalServerError('System ID is not defined', { layer: ErrorLayer.APPLICATION });

        const user = await User.create(data, creatorId);
        return this.userRepository.add(user);
    }
}
