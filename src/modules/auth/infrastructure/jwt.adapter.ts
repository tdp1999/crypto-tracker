import { IJwtData, IJwtPayload } from '@core/features/auth/authenticate.type';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IJwtService } from '../application/ports/auth-jwt.port';

export class JwtAdapter implements IJwtService {
    constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

    generatePayload(iss: string, sub: string, email: string): IJwtPayload {
        return { iss, sub, email };
    }

    sign(payload: IJwtPayload): Promise<string> {
        return this.jwtService.signAsync(payload);
    }

    verify(token: string): Promise<IJwtData> {
        return this.jwtService.verifyAsync(token);
    }
}
