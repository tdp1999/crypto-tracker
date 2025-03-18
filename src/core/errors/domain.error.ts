import { HttpStatus } from '@nestjs/common';
import { ErrorOptions } from './types/error-options.type.error';

export interface DomainErrorPayload {
    statusCode: number;
    errorCode?: string | null;
    error: string;
    message: string;
    remarks?: string;
}

export class DomainError extends Error {
    statusCode: number;
    errorCode?: string | null;
    error: string;
    message: string;
    remarks?: string;

    /* Factory method - https://refactoring.guru/design-patterns/factory-method */
    private constructor(payload: DomainErrorPayload) {
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
            message: this.message,
            remarks: this.remarks,
        };
    }

    // Static method to reconstruct the error from a plain object
    static fromJSON(json: DomainErrorPayload): DomainError {
        return new DomainError({
            statusCode: json.statusCode,
            errorCode: json.errorCode,
            error: json.error,
            message: json.message,
            remarks: json.remarks,
        });
    }
}

// 400
export const BadRequestError = (message: string = 'Data is invalid', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: message,
        errorCode: options?.errorCode || null,
        remarks: options?.remarks,
    });
};

// 401
export const UnauthorizedError = (message: string = 'Unauthorized', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'Unauthorized',
        message: message,
        errorCode: options?.errorCode || null,
        remarks: options?.remarks,
    });
};

// 403
export const ForbiddenError = (message: string = 'Forbidden', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        message: message,
        errorCode: options?.errorCode || null,
        remarks: options?.remarks,
    });
};

// 404
export const NotFoundError = (message: string = 'Not Found', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: message,
        errorCode: options?.errorCode || null,
        remarks: options?.remarks,
    });
};

// 500
export const InternalServerError = (message: string = 'Internal Server Error', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: message,
        errorCode: options?.errorCode || null,
        remarks: options?.remarks,
    });
};

export const NotSupportedMethodError = (message: string = 'Not Supported Method', options?: ErrorOptions) => {
    return DomainError.fromJSON({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Not Supported Method',
        message: message,
        errorCode: options?.errorCode || null,
        remarks: options?.remarks,
    });
};
