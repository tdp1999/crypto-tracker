import { HttpStatus } from '@nestjs/common';
import { ErrorOptions } from './types/error-options.type.error';

export interface InfrastructureErrorPayload {
    statusCode: number;
    errorCode?: string | null;
    error: string;
    message: string;
    remarks?: string;
    cause?: Error;
}

export class InfrastructureError extends Error {
    statusCode: number;
    errorCode?: string | null;
    error: string;
    message: string;
    remarks?: string;
    cause?: Error;

    private constructor(payload: {
        statusCode: number;
        errorCode?: string | null;
        error: string;
        message: string;
        remarks?: string;
        cause?: Error;
    }) {
        super(payload.message);
        Object.assign(this, payload);
        Object.setPrototypeOf(this, InfrastructureError.prototype);
    }

    toJSON() {
        return {
            name: 'InfrastructureError',
            statusCode: this.statusCode,
            errorCode: this.errorCode,
            error: this.error,
            message: this.message,
            remarks: this.remarks,
            cause: this.cause ? InfrastructureError.serializeError(this.cause) : undefined,
        };
    }

    static fromJSON(json: InfrastructureErrorPayload): InfrastructureError {
        return new InfrastructureError({
            statusCode: json.statusCode,
            errorCode: json.errorCode,
            error: json.error,
            message: json.message,
            remarks: json.remarks,
            cause: json.cause ? new Error(json.cause.message) : undefined,
        });
    }

    private static serializeError(error: Error): object {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack, // Include stack trace for debugging
        };
    }
}

export const DatabaseError = (message: string = 'Database error', cause?: Error, options?: ErrorOptions) => {
    return InfrastructureError.fromJSON({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: options?.errorCode,
        error: 'DATABASE_ERROR',
        message,
        remarks: options?.remarks,
        cause,
    });
};
