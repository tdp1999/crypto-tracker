import { DomainError } from '@core/errors/domain.error';
import { Catch, ExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
    catch(exception: unknown): Observable<any> {
        // If it's a DomainError, ensure it's properly serialized
        if (exception instanceof DomainError) {
            return throwError(() => exception.toJSON());
        }

        // For other errors, convert to a standard format
        if (exception instanceof Error) {
            return throwError(() => ({
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
            }));
        }

        // For non-Error objects
        return throwError(() => exception);
    }
}
