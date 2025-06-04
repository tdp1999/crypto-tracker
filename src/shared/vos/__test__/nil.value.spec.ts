import { NilValue } from '../nil.value';

describe('NilValue', () => {
    describe('notNil', () => {
        it('should return true for non-null and non-undefined values', () => {
            expect(NilValue.notNil('string')).toBe(true);
            expect(NilValue.notNil(123)).toBe(true);
            expect(NilValue.notNil(0)).toBe(true);
            expect(NilValue.notNil(false)).toBe(true);
            expect(NilValue.notNil(true)).toBe(true);
            expect(NilValue.notNil('')).toBe(true);
            expect(NilValue.notNil([])).toBe(true);
            expect(NilValue.notNil({})).toBe(true);
        });

        it('should return false for null', () => {
            expect(NilValue.notNil(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(NilValue.notNil(undefined)).toBe(false);
        });

        it('should handle edge cases correctly', () => {
            expect(NilValue.notNil(NaN)).toBe(true);
            expect(NilValue.notNil(Infinity)).toBe(true);
            expect(NilValue.notNil(-Infinity)).toBe(true);
        });

        it('should return correct type (boolean)', () => {
            expect(typeof NilValue.notNil('test')).toBe('boolean');
            expect(typeof NilValue.notNil(null)).toBe('boolean');
        });
    });

    describe('isNil', () => {
        it('should return true for null', () => {
            expect(NilValue.isNil(null)).toBe(true);
        });

        it('should return true for undefined', () => {
            expect(NilValue.isNil(undefined)).toBe(true);
        });

        it('should return false for non-null and non-undefined values', () => {
            expect(NilValue.isNil('string')).toBe(false);
            expect(NilValue.isNil(123)).toBe(false);
            expect(NilValue.isNil(0)).toBe(false);
            expect(NilValue.isNil(false)).toBe(false);
            expect(NilValue.isNil(true)).toBe(false);
            expect(NilValue.isNil('')).toBe(false);
            expect(NilValue.isNil([])).toBe(false);
            expect(NilValue.isNil({})).toBe(false);
        });

        it('should handle edge cases correctly', () => {
            expect(NilValue.isNil(NaN)).toBe(false);
            expect(NilValue.isNil(Infinity)).toBe(false);
            expect(NilValue.isNil(-Infinity)).toBe(false);
        });

        it('should return correct type (boolean)', () => {
            expect(typeof NilValue.isNil('test')).toBe('boolean');
            expect(typeof NilValue.isNil(null)).toBe('boolean');
        });
    });

    describe('inverse relationship', () => {
        it('should have notNil and isNil as inverse operations', () => {
            const testValues = [null, undefined, 'string', 123, 0, false, true, '', [], {}, NaN, Infinity];

            testValues.forEach((value) => {
                expect(NilValue.notNil(value)).toBe(!NilValue.isNil(value));
            });
        });
    });
});
