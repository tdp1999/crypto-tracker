export class NilValue {
    static notNil(value: any): boolean {
        return value !== null && value !== undefined;
    }

    static isNil(value: any): boolean {
        return value === null || value === undefined;
    }
}
