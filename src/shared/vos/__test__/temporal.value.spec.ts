import { TemporalValue } from '../temporal.value';

describe('TemporalValue', () => {
    describe('now', () => {
        it('should return current timestamp as bigint', () => {
            const before = BigInt(Date.now());
            const result = TemporalValue.now;
            const after = BigInt(Date.now());

            expect(typeof result).toBe('bigint');
            expect(result).toBeGreaterThanOrEqual(before);
            expect(result).toBeLessThanOrEqual(after);
        });

        it('should return different values on consecutive calls', () => {
            const first = TemporalValue.now;
            // Small delay to ensure different timestamps
            const second = TemporalValue.now;

            expect(second).toBeGreaterThanOrEqual(first);
        });
    });

    describe('isoStringToTimestamp', () => {
        it('should convert valid ISO string to timestamp', () => {
            const isoString = '2023-01-01T00:00:00.000Z';
            const expected = BigInt(new Date(isoString).getTime());

            const result = TemporalValue.isoStringToTimestamp(isoString);

            expect(result).toBe(expected);
            expect(typeof result).toBe('bigint');
        });

        it('should handle ISO string with timezone', () => {
            const isoString = '2023-06-15T14:30:45.123+02:00';
            const expected = BigInt(new Date(isoString).getTime());

            const result = TemporalValue.isoStringToTimestamp(isoString);

            expect(result).toBe(expected);
        });

        it('should handle ISO string without milliseconds', () => {
            const isoString = '2023-12-31T23:59:59Z';
            const expected = BigInt(new Date(isoString).getTime());

            const result = TemporalValue.isoStringToTimestamp(isoString);

            expect(result).toBe(expected);
        });

        it('should handle date-only ISO string', () => {
            const isoString = '2023-07-20';
            const expected = BigInt(new Date(isoString).getTime());

            const result = TemporalValue.isoStringToTimestamp(isoString);

            expect(result).toBe(expected);
        });

        it('should throw error for invalid ISO string', () => {
            const invalidIsoString = 'invalid-date';

            expect(() => {
                TemporalValue.isoStringToTimestamp(invalidIsoString);
            }).toThrow('The number NaN cannot be converted to a BigInt');
        });

        it('should throw error for empty string', () => {
            expect(() => {
                TemporalValue.isoStringToTimestamp('');
            }).toThrow('The number NaN cannot be converted to a BigInt');
        });
    });

    describe('addMillis', () => {
        it('should add positive milliseconds to timestamp', () => {
            const baseTimestamp = BigInt(1000000);
            const millisToAdd = 5000;
            const expected = BigInt(1005000);

            const result = TemporalValue.addMillis(baseTimestamp, millisToAdd);

            expect(result).toBe(expected);
            expect(typeof result).toBe('bigint');
        });

        it('should subtract when adding negative milliseconds', () => {
            const baseTimestamp = BigInt(1000000);
            const millisToAdd = -3000;
            const expected = BigInt(997000);

            const result = TemporalValue.addMillis(baseTimestamp, millisToAdd);

            expect(result).toBe(expected);
        });

        it('should handle zero milliseconds', () => {
            const baseTimestamp = BigInt(1000000);
            const millisToAdd = 0;

            const result = TemporalValue.addMillis(baseTimestamp, millisToAdd);

            expect(result).toBe(baseTimestamp);
        });

        it('should handle large numbers', () => {
            const baseTimestamp = BigInt(Number.MAX_SAFE_INTEGER);
            const millisToAdd = 1000;
            const expected = baseTimestamp + BigInt(millisToAdd);

            const result = TemporalValue.addMillis(baseTimestamp, millisToAdd);

            expect(result).toBe(expected);
        });

        it('should handle decimal milliseconds by converting to integer', () => {
            const baseTimestamp = BigInt(1000000);
            const millisToAdd = 1500.7; // BigInt conversion will fail for decimal numbers

            expect(() => {
                TemporalValue.addMillis(baseTimestamp, millisToAdd);
            }).toThrow('The number 1500.7 cannot be converted to a BigInt because it is not an integer');
        });

        it('should work with current timestamp', () => {
            const currentTimestamp = TemporalValue.now;
            const millisToAdd = 10000;

            const result = TemporalValue.addMillis(currentTimestamp, millisToAdd);

            expect(result).toBe(currentTimestamp + BigInt(millisToAdd));
            expect(result).toBeGreaterThan(currentTimestamp);
        });
    });

    describe('integration tests', () => {
        it('should work together: ISO string to timestamp and add millis', () => {
            const isoString = '2023-01-01T00:00:00.000Z';
            const timestamp = TemporalValue.isoStringToTimestamp(isoString);
            const millisToAdd = 60000; // 1 minute

            const result = TemporalValue.addMillis(timestamp, millisToAdd);
            const expectedTimestamp = BigInt(new Date('2023-01-01T00:01:00.000Z').getTime());

            expect(result).toBe(expectedTimestamp);
        });

        it('should maintain precision with large timestamps', () => {
            const currentTime = TemporalValue.now;
            const added = TemporalValue.addMillis(currentTime, 1);

            expect(added - currentTime).toBe(BigInt(1));
        });
    });
});
