import { ClientModule } from '@core/features/client/client.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_TOKEN } from './application/auth.token';
import { LoginCommandHandler } from './application/commands/login.command';
import { RegisterCommandHandler } from './application/commands/register.command';
import { VerifyQueryHandler } from './application/queries/verify.query';
import { AuthController } from './infrastructure/auth.controller';
import { AuthRepository } from './infrastructure/auth.repository';
import { AuthRpcController } from './infrastructure/auth.rpc';
import { JwtAdapter } from './infrastructure/jwt.adapter';

const queryHandlers = [VerifyQueryHandler];
const commandHandlers = [LoginCommandHandler, RegisterCommandHandler];

@Module({
    controllers: [AuthController, AuthRpcController],
    imports: [
        ClientModule.registerAsync(),
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('general.jwtSecret') || 'your-secret-key',
                signOptions: { expiresIn: configService.get('general.jwtExpirationTime') || '1d' },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        {
            provide: AUTH_TOKEN.JWT_SERVICE,
            useClass: JwtAdapter,
        },
        {
            provide: AUTH_TOKEN.REPOSITORY,
            useClass: AuthRepository,
        },

        ...queryHandlers,
        ...commandHandlers,
    ],
})
export class AuthModule {}
