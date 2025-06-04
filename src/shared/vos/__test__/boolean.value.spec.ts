import { BooleanValue } from '../boolean.value';

describe('BooleanValue', () => {
    describe('toBoolean', () => {
        it('should convert "true" string to boolean true', () => {
            const result = BooleanValue.toBoolean('true');

            expect(result).toBe(true);
            expect(typeof result).toBe('boolean');
        });

        it('should convert "TRUE" string to boolean true', () => {
            const result = BooleanValue.toBoolean('TRUE');

            expect(result).toBe(true);
        });

        it('should convert "True" string to boolean true', () => {
            const result = BooleanValue.toBoolean('True');

            expect(result).toBe(true);
        });

        it('should convert "false" string to boolean false', () => {
            const result = BooleanValue.toBoolean('false');

            expect(result).toBe(false);
            expect(typeof result).toBe('boolean');
        });

        it('should convert "FALSE" string to boolean false', () => {
            const result = BooleanValue.toBoolean('FALSE');

            expect(result).toBe(false);
        });

        it('should convert "False" string to boolean false', () => {
            const result = BooleanValue.toBoolean('False');

            expect(result).toBe(false);
        });

        it('should throw error for null value', () => {
            expect(() => {
                BooleanValue.toBoolean(null);
            }).toThrow('Invalid boolean value');
        });

        it('should throw error for undefined value', () => {
            expect(() => {
                BooleanValue.toBoolean(undefined);
            }).toThrow('Invalid boolean value');
        });

        it('should throw error for empty string', () => {
            expect(() => {
                BooleanValue.toBoolean('');
            }).toThrow('Invalid boolean value');
        });

        it('should throw error for number value', () => {
            expect(() => {
                BooleanValue.toBoolean(1);
            }).toThrow('Invalid boolean value');
        });

        it('should throw error for boolean value', () => {
            expect(() => {
                BooleanValue.toBoolean(true);
            }).toThrow('Invalid boolean value');
        });

        it('should throw error for object value', () => {
            expect(() => {
                BooleanValue.toBoolean({});
            }).toThrow('Invalid boolean value');
        });

        it('should throw error for array value', () => {
            expect(() => {
                BooleanValue.toBoolean([]);
            }).toThrow('Invalid boolean value');
        });

        it('should throw error for invalid string values', () => {
            const invalidValues = ['yes', 'no', '1', '0', 'truee', 'falsee', ' true', 'true '];

            invalidValues.forEach((value) => {
                expect(() => {
                    BooleanValue.toBoolean(value);
                }).toThrow('Invalid boolean value');
            });
        });

        it('should handle mixed case variations', () => {
            expect(BooleanValue.toBoolean('tRuE')).toBe(true);
            expect(BooleanValue.toBoolean('fAlSe')).toBe(false);
            expect(BooleanValue.toBoolean('TrUe')).toBe(true);
            expect(BooleanValue.toBoolean('FaLsE')).toBe(false);
        });
    });
});
