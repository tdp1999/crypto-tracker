import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Inject, Injectable } from '@nestjs/common';
import { ICommandHandler } from '@shared/types/cqrs.type';
import { AuthLoginDto, AuthLoginSchema } from '../auth.dto';
import { AUTH_TOKEN } from '../auth.token';
import { IAuthUserRepository } from '../ports/auth-repository.port';

@Injectable()
export class LoginCommandHandler implements ICommandHandler<AuthLoginDto, string> {
    constructor(
        @Inject(AUTH_TOKEN.USER_REPOSITORY)
        private readonly userRepository: IAuthUserRepository,
    ) {}

    async execute(command: AuthLoginDto) {
        const { success, data, error } = AuthLoginSchema.safeParse(command);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'User creation failed' });

        // const user = await this.userRepository.getByEmail(data.email);
        // if (!user) throw BadRequestError('User not found', { layer: ErrorLayer.APPLICATION, remarks: 'User creation failed' });

        // const isPasswordValid = await this.userRepository.getPassword(user.id);
        // if (!isPasswordValid) throw BadRequestError('Invalid password', { layer: ErrorLayer.APPLICATION, remarks: 'User creation failed' });

        return 'success';
    }
}
