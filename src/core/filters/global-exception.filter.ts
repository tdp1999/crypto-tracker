import { DomainError } from '@core/errors/domain.error';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { BooleanValue } from '@shared/vos/boolean.value';
import { AxiosError } from 'axios';

export interface FormattedResponse {
    statusCode: number;
    errorCode: string | null;
    error: string;
    message: any;
    remarks?: string | null;
}

interface HttpExceptionResponse {
    statusCode?: number;
    error?: string;
    message?: string | string[];
    errorCode?: string | null;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);
    private readonly isDebugMode: boolean = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpAdapterHost: HttpAdapterHost,
    ) {
        this.isDebugMode = BooleanValue.toBoolean(this.configService.get('general.debug'));
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();

        if (exception instanceof DomainError) {
            const [status, responseContent] = this._domainExceptionContent(exception);
            httpAdapter.reply(ctx.getResponse(), responseContent, status);
            return;
        }

        if (exception instanceof AxiosError) {
            const [status, responseContent] = this._axiosExceptionContent(exception);
            httpAdapter.reply(ctx.getResponse(), responseContent, status);
            return;
        }

        if (exception instanceof HttpException) {
            const [status, responseContent] = this._httpExceptionContent(exception);
            httpAdapter.reply(ctx.getResponse(), responseContent, status);
            return;
        }

        const [status, responseContent] = this._unknownExceptionContent(exception, request, this.logger);

        httpAdapter.reply(ctx.getResponse(), responseContent, status);
    }

    private _domainExceptionContent(exception: DomainError): [number, FormattedResponse] {
        const { statusCode, error, message, errorCode = null, remarks } = exception;

        if (this.isDebugMode) {
            return [statusCode, { statusCode, error, message, errorCode, remarks }];
        }

        return [statusCode, { statusCode, error, message, errorCode }];
    }

    private _axiosExceptionContent(exception: AxiosError): [number, FormattedResponse] {
        const { status, data } = exception.response ?? {};
        const statusCode = status ?? 500;
        const errorCode = null;
        const error = 'External API Error';
        const message = (data as { error: string })?.error ?? 'An unknown error occurred. Please try again later.';
        const remarks = '[Axios Exception]';

        if (this.isDebugMode) {
            return [statusCode, { statusCode, error, message, errorCode, remarks }];
        }

        return [statusCode, { statusCode, error, message, errorCode }];
    }

    private _httpExceptionContent(exception: HttpException): [number, FormattedResponse] {
        const status = exception.getStatus();
        const errorResponse = exception.getResponse() as HttpExceptionResponse | string;

        if (typeof errorResponse === 'string') {
            return [
                status,
                {
                    statusCode: status,
                    error: 'Error',
                    message: errorResponse,
                    errorCode: null,
                },
            ];
        }

        return [
            status,
            {
                statusCode: status,
                error: errorResponse.error || 'Error',
                message: errorResponse.message || exception.message,
                errorCode: errorResponse.errorCode || null,
            },
        ];
    }

    private _unknownExceptionContent(
        exception: unknown,
        request: Request,
        logger: Logger,
    ): [number, FormattedResponse] {
        const unknownErrorMessage = 'An unknown error occurred. Please try again later.';
        const errorMessage = exception instanceof Error ? exception.message : unknownErrorMessage;
        const stack =
            exception && typeof exception === 'object' && 'stack' in exception
                ? exception['stack']
                : 'No stacktrace available';

        logger.error(`Error occurred for ${request.method} ${request.url}: ${errorMessage}`, stack);

        return [
            HttpStatus.INTERNAL_SERVER_ERROR,
            {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Internal Server Error',
                message: errorMessage,
                errorCode: null,
                remarks: '[Unknown Exception]',
            },
        ];
    }
}
