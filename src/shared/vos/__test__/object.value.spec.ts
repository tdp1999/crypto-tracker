import { ObjectValue } from '../object.value';

describe('ObjectValue', () => {
    describe('isEmpty', () => {
        it('should return true for empty object', () => {
            const result = ObjectValue.isEmpty({});

            expect(result).toBe(true);
        });

        it('should return false for object with properties', () => {
            const result = ObjectValue.isEmpty({ key: 'value' });

            expect(result).toBe(false);
        });

        it('should return false for object with multiple properties', () => {
            const obj = {
                name: 'test',
                age: 25,
                active: true,
            };

            const result = ObjectValue.isEmpty(obj);

            expect(result).toBe(false);
        });

        it('should return false for object with undefined values', () => {
            const obj = {
                key1: undefined,
                key2: null,
            };

            const result = ObjectValue.isEmpty(obj);

            expect(result).toBe(false);
        });

        it('should return false for object with falsy values', () => {
            const obj = {
                zero: 0,
                empty: '',
                falsy: false,
            };

            const result = ObjectValue.isEmpty(obj);

            expect(result).toBe(false);
        });

        it('should return false for object with nested objects', () => {
            const obj = {
                nested: {},
            };

            const result = ObjectValue.isEmpty(obj);

            expect(result).toBe(false);
        });

        it('should return false for object with arrays', () => {
            const obj = {
                items: [],
            };

            const result = ObjectValue.isEmpty(obj);

            expect(result).toBe(false);
        });

        it('should return false for object with function properties', () => {
            const obj = {
                method: () => {},
            };

            const result = ObjectValue.isEmpty(obj);

            expect(result).toBe(false);
        });

        it('should return true for object with only symbol properties', () => {
            const symbol = Symbol('test');
            const obj = {
                [symbol]: 'value',
            };

            const result = ObjectValue.isEmpty(obj);

            expect(result).toBe(true); // Symbol properties are not counted by Object.keys()
        });

        it('should handle objects created with Object.create()', () => {
            const proto = { inherited: 'value' };
            const obj = Object.create(proto);

            const result = ObjectValue.isEmpty(obj);

            expect(result).toBe(true); // Only own properties count
        });

        it('should return correct type (boolean)', () => {
            expect(typeof ObjectValue.isEmpty({})).toBe('boolean');
            expect(typeof ObjectValue.isEmpty({ key: 'value' })).toBe('boolean');
        });

        it('should handle object with enumerable and non-enumerable properties', () => {
            const obj = {};
            Object.defineProperty(obj, 'nonEnumerable', {
                value: 'hidden',
                enumerable: false,
            });

            const result = ObjectValue.isEmpty(obj);

            expect(result).toBe(true); // Non-enumerable properties are not counted by Object.keys
        });

        it('should handle edge cases with different object types', () => {
            expect(ObjectValue.isEmpty({})).toBe(true);
            expect(ObjectValue.isEmpty({ a: 1 })).toBe(false);
            expect(ObjectValue.isEmpty({ '': '' })).toBe(false); // Empty string key still counts
            expect(ObjectValue.isEmpty({ 0: 'zero' })).toBe(false); // Numeric keys count
        });
    });
});
