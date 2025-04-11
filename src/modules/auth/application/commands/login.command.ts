import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthLoginDto, AuthLoginSchema } from '../auth.dto';
import { AUTH_TOKEN } from '../auth.token';
import { IJwtService } from '../ports/auth-jwt.port';
import { IAuthLoginResponse } from '../ports/auth-login.in.port';
import { IAuthRepository } from '../ports/auth-repository.port';

export class LoginCommand {
    constructor(public readonly payload: { dto: AuthLoginDto }) {}
}

@Injectable()
@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand, IAuthLoginResponse> {
    constructor(
        @Inject(AUTH_TOKEN.REPOSITORY)
        private readonly repository: IAuthRepository,

        @Inject(AUTH_TOKEN.JWT_SERVICE)
        private readonly jwtService: IJwtService,
    ) {}

    async execute(command: LoginCommand) {
        const { success, data, error } = AuthLoginSchema.safeParse(command.payload.dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'User creation failed' });

        const result = await this.repository.validateCredential(data.email, data.password);

        if (!result.isValid) throw BadRequestError(result.invalidMessage, { layer: ErrorLayer.APPLICATION });

        const tokenPayload = this.jwtService.generatePayload('Crypto-Tracker', result.user.id, result.user.email);

        return { accessToken: await this.jwtService.sign(tokenPayload) };
    }
}
