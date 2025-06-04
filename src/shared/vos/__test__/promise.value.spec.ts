import { PromiseValue } from '../promise.value';

describe('PromiseValue', () => {
    describe('Void', () => {
        it('should return a resolved promise', async () => {
            const result = PromiseValue.Void();

            expect(result).toBeInstanceOf(Promise);
            await expect(result).resolves.toBeUndefined();
        });

        it('should return undefined when awaited', async () => {
            const result = await PromiseValue.Void();

            expect(result).toBeUndefined();
        });

        it('should be immediately resolved', () => {
            const promise = PromiseValue.Void();

            return promise.then((value) => {
                expect(value).toBeUndefined();
            });
        });

        it('should create different promise instances on each call', () => {
            const promise1 = PromiseValue.Void();
            const promise2 = PromiseValue.Void();

            expect(promise1).not.toBe(promise2);
            expect(promise1).toBeInstanceOf(Promise);
            expect(promise2).toBeInstanceOf(Promise);
        });
    });
});
