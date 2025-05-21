/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { USER_STATUS } from '@core/features/user/user.entity';
import { UserValidityResult } from '@core/features/user/user.type';
import { ForbiddenError, UnauthorizedError } from '@core/errors/domain.error';
import {
    ERR_AUTHORIZE_FORBIDDEN_ACCOUNT,
    ERR_AUTHORIZE_UNAUTHORIZED,
    ERR_AUTHORIZE_USER_NOT_FOUND,
} from '@core/errors/messages/common.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { CLIENT_PROXY } from '@core/features/client/client.token';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, lastValueFrom, of } from 'rxjs';
import { AuthenticateAction, AuthenticateUserAction } from './authenticate.action';
import { METADATA_PUBLIC, METADATA_REQUIRE_NO_AUTH } from './authenticate.token';
import { IJwtData } from './authenticate.type';

@Injectable()
export class AuthenticateGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @Inject(CLIENT_PROXY) private readonly client: ClientProxy,
    ) {}

    async canActivate(context: ExecutionContext) {
        // Check for public routes
        const isPublic = this.reflector.getAllAndOverride<boolean>(METADATA_PUBLIC, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const req: any =
            context.getType() === 'http'
                ? context.switchToHttp().getRequest<unknown>()
                : context.switchToRpc().getContext<unknown>();

        const authorization: string | undefined =
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            req.headers?.['authorization'] || req?.getHeaders?.()?.headers?.get('authorization')[0] || '';
        const accessToken = authorization?.replace('Bearer ', '');

        // Check for required no auth routes, like login, register, etc.
        const isRequiredNoAuth = this.reflector.getAllAndOverride<boolean>(METADATA_REQUIRE_NO_AUTH, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isRequiredNoAuth) {
            // This should be doing in the FE side!!
            // if (!!accessToken)
            //     throw BadRequestError(ERR_AUTHORIZE_REQUIRE_NO_AUTHORIZATION.message, { remarks: `Token found` });

            return true;
        }

        // Check if token is valid
        const tokenData = await lastValueFrom(
            this.client.send<IJwtData>(AuthenticateAction.VERIFY, accessToken).pipe(catchError(() => of(null))),
        );
        if (!tokenData)
            throw UnauthorizedError(ERR_AUTHORIZE_UNAUTHORIZED, {
                remarks: 'Token not found or invalid',
                layer: ErrorLayer.CORE,
            });

        // Check if user is valid
        const userId = tokenData.sub;
        const user = await lastValueFrom(
            this.client.send<Record<string, any>>(AuthenticateUserAction.GET, { userId, visibleColumns: [] }),
        );
        if (!user) throw UnauthorizedError(ERR_AUTHORIZE_USER_NOT_FOUND, { remarks: 'User not found' });

        // Attach user to request
        req.user = user;

        // Check if user account is valid
        const result = await lastValueFrom(this.client.send<UserValidityResult>(AuthenticateUserAction.VALIDATE, user));
        console.log('result', result);
        if (result.isValid) return true;
        if (result.status === USER_STATUS.DELETED)
            throw UnauthorizedError(ERR_AUTHORIZE_UNAUTHORIZED, { remarks: 'User deleted' });

        throw ForbiddenError(result.invalidMessage || ERR_AUTHORIZE_FORBIDDEN_ACCOUNT, {
            remarks: 'User not active',
        });
    }
}
