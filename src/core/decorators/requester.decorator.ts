import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Requester = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request =
        ctx.getType() === 'http'
            ? ctx.switchToHttp().getRequest<{ user: unknown }>()
            : ctx.switchToRpc().getContext<{ user: unknown }>();

    return request.user;
});
