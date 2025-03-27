import { HttpStatus } from '@nestjs/common';
import { ErrorOptions } from './types/error-options.type.error';

// Only for internal use
interface DomainErrorContructPayload {
    statusCode: number;
    errorCode?: string | null;
    error: string;
    message: any;
    remarks?: string;
}

export interface DomainErrorPayload {
    statusCode: number;
    errorCode?: string | null;
    error: string;
    message: any;
    options?: ErrorOptions;
}

export function constructRemarks(options?: ErrorOptions): string | undefined {
    if (!options || (!options.remarks && !options.remarks)) return undefined;

    const prefix = options.layer ? `[${options.layer.toUpperCase()}]` : '';

    return `${prefix} ${options.remarks}`.trim();
}

export class DomainError extends Error {
    statusCode: number;
    errorCode?: string | null;
    error: string;
    message: any;
    remarks?: string;

    /* Factory method - https://refactoring.guru/design-patterns/factory-method */
    private constructor(payload: DomainErrorContructPayload) {
        super();
        Object.assign(this, payload);
        Object.setPrototypeOf(this, DomainError.prototype);
    }

    // Add a method to convert the error to a plain object for serialization
    toJSON() {
        return {
            name: 'DomainError',
            statusCode: this.statusCode,
            errorCode: this.errorCode,
            error: this.error,
            message: this.message as unknown,
            remarks: this.remarks,
        };
    }

    // Static method to reconstruct the error from a plain object
    static fromJSON(json: DomainErrorPayload): DomainError {
        return new DomainError({
            statusCode: json.statusCode,
            errorCode: json.errorCode,
            error: json.error,
            message: json.message as unknown,
            remarks: constructRemarks(json.options),
        });
    }
}

// 400
export const BadRequestError = (message: any = 'Data is invalid', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: message as unknown,
        errorCode: options?.errorCode || null,
        options: options,
    });
};

// 401
export const UnauthorizedError = (message: any = 'Unauthorized', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'Unauthorized',
        message: message as unknown,
        errorCode: options?.errorCode || null,
        options: options,
    });
};

// 403
export const ForbiddenError = (message: any = 'Forbidden', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        message: message as unknown,
        errorCode: options?.errorCode || null,
        options: options,
    });
};

// 404
export const NotFoundError = (message: any = 'Not Found', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: message as unknown,
        errorCode: options?.errorCode || null,
        options: options,
    });
};

// 500
export const InternalServerError = (message: any = 'Internal Server Error', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: message as unknown,
        errorCode: options?.errorCode || null,
        options: options,
    });
};

export const NotSupportedMethodError = (message: any = 'Not Supported Method', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Not Supported Method',
        message: message as unknown,
        errorCode: options?.errorCode || null,
        options: options,
    });
};
