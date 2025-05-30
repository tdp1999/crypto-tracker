import { BadRequestError, InternalServerError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { User, UserCreateSchema } from '@core/features/user/user.entity';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserConfig } from '../ports/user-config.out.port';
import { IUserRepository } from '../ports/user-repository.out.port';
import { USER_TOKENS } from '../user.token';

export type UserCreatedBy = undefined | { id: string } | { self: true };

export class CreateUserCommand {
    constructor(public readonly payload: { dto: unknown; createdBy?: UserCreatedBy }) {}
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
        const { dto, createdBy } = command.payload;
        const { success, data, error } = UserCreateSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'User creation failed' });

        const isEmailExists = await this.userRepository.findOne({ email: data.email });

        if (isEmailExists)
            throw BadRequestError('Email already exists', {
                layer: ErrorLayer.APPLICATION,
                remarks: 'User creation failed',
            });

        const systemId = this.config.getSystemId();
        const manualRegistrationId = this.config.getDefaultManualRegistrationId();

        const creatorId = this._getCreatorId(createdBy, manualRegistrationId, systemId);
        if (!creatorId) throw InternalServerError('System ID is not defined', { layer: ErrorLayer.APPLICATION });

        const user = await User.create(data, creatorId);
        const userId = await this.userRepository.add(user);

        return userId;
    }

    private _getCreatorId(
        createdBy: UserCreatedBy,
        manualRegistrationId: Id | undefined,
        systemId: Id | undefined,
    ): Id | undefined {
        if (!createdBy) return systemId;

        if ('self' in createdBy) return manualRegistrationId;

        return createdBy.id;
    }
}
