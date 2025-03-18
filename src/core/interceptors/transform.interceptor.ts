import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface Response<T> {
    data: T;
    statusCode: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        return next.handle().pipe(
            map((data: T) => {
                const response = context.switchToHttp().getResponse<Response<T>>();
                const statusCode = response.statusCode;

                return {
                    data,
                    statusCode,
                };
            }),
        );
    }
}
