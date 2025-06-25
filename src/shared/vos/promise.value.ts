export class PromiseValue {
    static void() {
        return Promise.resolve();
    }

    static arbitrary<T>(value: T): Promise<T> {
        return Promise.resolve(value);
    }
}
