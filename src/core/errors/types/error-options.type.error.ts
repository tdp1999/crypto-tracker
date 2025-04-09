import { ErrorLayer } from './error-layer.type.error';

export interface ErrorOptions {
    errorCode?: string | null;
    remarks?: string;
    layer?: ErrorLayer;
}
