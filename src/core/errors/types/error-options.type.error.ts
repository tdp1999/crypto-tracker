export interface ErrorOptions {
    errorCode?: string | null;
    remarks?: string;
    layer?: 'infrastructure' | 'application' | 'domain' | 'core';
}
