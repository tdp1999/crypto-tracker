import { DomainError, DomainErrorPayload } from '@core/errors/domain.error';

// Use this decorator to wrap the RPC call with error handling
export function RpcClient() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value as (...args: any[]) => Promise<any>;

        descriptor.value = async function (...args: any[]) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return await originalMethod.apply(this, args);
            } catch (error) {
                if (!error || typeof error !== 'object') throw error;

                // Catch error from RPC, since the error go through rpc cannot maintain the class, only object
                // See DomainError.toJson()
                if ((error as unknown as { name: string }).name === 'DomainError') {
                    throw DomainError.fromJSON(error as DomainErrorPayload);
                }

                // If it's a standard Error, you might want to wrap it
                if (error instanceof Error) {
                    throw DomainError.fromJSON({
                        statusCode: 500,
                        errorCode: 'RPC_ERROR',
                        error: 'RPC Call Failed',
                        message: error.message,
                    });
                }

                // Handle any errors that might occur during the RPC call
                throw error;
            }
        };

        return descriptor;
    };
}
