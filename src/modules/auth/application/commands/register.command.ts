import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { hashByBcrypt } from '@shared/utils/hash.util';
import { AuthRegisterDto, AuthRegisterSchema } from '../auth.dto';
import { AUTH_TOKEN } from '../auth.token';
import { IAuthRepository } from '../ports/auth-repository.port';

export class RegisterCommand {
    constructor(public readonly payload: { dto: AuthRegisterDto }) {}
}

@CommandHandler(RegisterCommand)
export class RegisterCommandHandler implements ICommandHandler<RegisterCommand, boolean> {
    constructor(
        @Inject(AUTH_TOKEN.REPOSITORY)
        private readonly repository: IAuthRepository,
    ) {}

    async execute(command: RegisterCommand): Promise<boolean> {
        const { success, data, error } = AuthRegisterSchema.safeParse(command.payload.dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'User creation failed' });

        const hashedPassword = await hashByBcrypt(data.password);
        const userId = await this.repository.create({ ...data, password: hashedPassword });

        return !!userId;
    }
}
