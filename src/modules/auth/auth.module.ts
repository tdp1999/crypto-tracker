import { ClientModule } from '@core/features/client/client.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_TOKEN } from './application/auth.token';
import { AuthController } from './infrastructure/auth.controller';
import { JwtAdapter } from './infrastructure/jwt.adapter';

@Module({
    controllers: [AuthController],
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
    ],
})
export class AuthModule {}
