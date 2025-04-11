import { DomainError, DomainErrorPayload } from '@core/errors/domain.error';

/**
 * Process RPC errors with consistent logic
 */
const processRpcError = (error: unknown): Error => {
    if (!error || typeof error !== 'object') {
        return error as Error;
    }

    // Catch error from RPC, since the error go through rpc cannot maintain the class, only object
    // See DomainError.toJson()
    if ((error as unknown as { name: string }).name === 'DomainError') {
        return DomainError.fromJSON(error as DomainErrorPayload);
    }

    // If it's a standard Error, you might want to wrap it
    if (error instanceof Error) {
        return DomainError.fromJSON({
            statusCode: 500,
            errorCode: 'RPC_ERROR',
            error: 'RPC Call Failed',
            message: error.message,
        });
    }

    // Return the original error
    return error as Error;
};

/**
 * Wraps a method with RPC error handling
 */
const wrapMethodWithErrorHandling = (originalMethod: (...args: any[]) => Promise<any>) => {
    return async function (...args: any[]) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
            return await originalMethod.apply(this, args);
        } catch (error) {
            throw processRpcError(error);
        }
    };
};

// Use this decorator to wrap the RPC call with error handling
export function RpcClient() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value as (...args: any[]) => Promise<any>;
        descriptor.value = wrapMethodWithErrorHandling(originalMethod);
        return descriptor;
    };
}

// Class decorator that applies RPC client error handling to all methods in a class
export function RpcClientRepository() {
    return function <T extends { new (...args: any[]): any }>(constructor: T) {
        // Get all property names of the prototype
        const propertyNames = Object.getOwnPropertyNames(constructor.prototype);

        // Filter out constructor and apply the decoration to all methods
        propertyNames
            .filter((propertyName) => propertyName !== 'constructor')
            .forEach((propertyName) => {
                const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, propertyName);

                // Only decorate methods (functions)
                if (descriptor && typeof descriptor.value === 'function') {
                    const originalMethod = descriptor.value;
                    descriptor.value = wrapMethodWithErrorHandling(originalMethod);
                    Object.defineProperty(constructor.prototype, propertyName, descriptor);
                }
            });

        return constructor;
    };
}
