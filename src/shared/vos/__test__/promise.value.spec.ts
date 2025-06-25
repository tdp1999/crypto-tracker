import { PromiseValue } from '../promise.value';

describe('PromiseValue', () => {
    describe('Void', () => {
        it('should return a resolved promise', async () => {
            const result = PromiseValue.void();

            expect(result).toBeInstanceOf(Promise);
            await expect(result).resolves.toBeUndefined();
        });

        it('should return undefined when awaited', async () => {
            const result = await PromiseValue.void();

            expect(result).toBeUndefined();
        });

        it('should be immediately resolved', () => {
            const promise = PromiseValue.void();

            return promise.then((value) => {
                expect(value).toBeUndefined();
            });
        });

        it('should create different promise instances on each call', () => {
            const promise1 = PromiseValue.void();
            const promise2 = PromiseValue.void();

            expect(promise1).not.toBe(promise2);
            expect(promise1).toBeInstanceOf(Promise);
            expect(promise2).toBeInstanceOf(Promise);
        });
    });
});
