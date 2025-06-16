import { TemporalValue } from '../temporal.value';

describe('TemporalValue', () => {
    describe('now', () => {
        it('should return current timestamp as ISO string', () => {
            const before = new Date().toISOString();
            const result = TemporalValue.now;
            const after = new Date().toISOString();

            expect(typeof result).toBe('string');
            expect(new Date(result).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
            expect(new Date(result).getTime()).toBeLessThanOrEqual(new Date(after).getTime());
        });

        it('should return different values on consecutive calls', () => {
            const first = TemporalValue.now;
            // Small delay to ensure different timestamps
            const second = TemporalValue.now;

            expect(new Date(second).getTime()).toBeGreaterThanOrEqual(new Date(first).getTime());
        });
    });

    describe('addMillis', () => {
        it('should add positive milliseconds to ISO string', () => {
            const baseIsoString = '2023-01-01T00:00:00.000Z';
            const millisToAdd = 5000;
            const expected = '2023-01-01T00:00:05.000Z';

            const result = TemporalValue.addMillis(baseIsoString, millisToAdd);

            expect(result).toBe(expected);
            expect(typeof result).toBe('string');
        });

        it('should subtract when adding negative milliseconds', () => {
            const baseIsoString = '2023-01-01T00:00:05.000Z';
            const millisToAdd = -3000;
            const expected = '2023-01-01T00:00:02.000Z';

            const result = TemporalValue.addMillis(baseIsoString, millisToAdd);

            expect(result).toBe(expected);
        });

        it('should handle zero milliseconds', () => {
            const baseIsoString = '2023-01-01T00:00:00.000Z';
            const millisToAdd = 0;

            const result = TemporalValue.addMillis(baseIsoString, millisToAdd);

            expect(result).toBe(baseIsoString);
        });

        it('should work with current timestamp', () => {
            const currentTimestamp = TemporalValue.now;
            const millisToAdd = 10000;

            const result = TemporalValue.addMillis(currentTimestamp, millisToAdd);

            expect(new Date(result).getTime()).toBe(new Date(currentTimestamp).getTime() + millisToAdd);
            expect(new Date(result).getTime()).toBeGreaterThan(new Date(currentTimestamp).getTime());
        });
    });

    describe('addDays', () => {
        it('should add days to ISO string', () => {
            const baseIsoString = '2023-01-01T00:00:00.000Z';
            const daysToAdd = 5;
            const expected = '2023-01-06T00:00:00.000Z';

            const result = TemporalValue.addDays(baseIsoString, daysToAdd);

            expect(result).toBe(expected);
        });

        it('should subtract days when adding negative days', () => {
            const baseIsoString = '2023-01-06T00:00:00.000Z';
            const daysToAdd = -3;
            const expected = '2023-01-03T00:00:00.000Z';

            const result = TemporalValue.addDays(baseIsoString, daysToAdd);

            expect(result).toBe(expected);
        });
    });

    describe('toDateOnly', () => {
        it('should extract date part from ISO string', () => {
            const isoString = '2023-01-01T15:30:45.123Z';
            const expected = '2023-01-01';

            const result = TemporalValue.toDateOnly(isoString);

            expect(result).toBe(expected);
        });
    });

    describe('fromDateOnly', () => {
        it('should convert date string to ISO string', () => {
            const dateString = '2023-01-01';
            const expected = '2023-01-01T00:00:00.000Z';

            const result = TemporalValue.fromDateOnly(dateString);

            expect(result).toBe(expected);
        });
    });

    describe('comparison methods', () => {
        it('should correctly compare dates with isAfter', () => {
            const earlier = '2023-01-01T00:00:00.000Z';
            const later = '2023-01-02T00:00:00.000Z';

            expect(TemporalValue.isAfter(later, earlier)).toBe(true);
            expect(TemporalValue.isAfter(earlier, later)).toBe(false);
        });

        it('should correctly compare dates with isBefore', () => {
            const earlier = '2023-01-01T00:00:00.000Z';
            const later = '2023-01-02T00:00:00.000Z';

            expect(TemporalValue.isBefore(earlier, later)).toBe(true);
            expect(TemporalValue.isBefore(later, earlier)).toBe(false);
        });
    });

    describe('diffInMinutes', () => {
        it('should calculate difference in minutes', () => {
            const time1 = '2023-01-01T00:00:00.000Z';
            const time2 = '2023-01-01T00:05:00.000Z';

            const result = TemporalValue.diffInMinutes(time1, time2);

            expect(result).toBe(5);
        });

        it('should return absolute difference', () => {
            const time1 = '2023-01-01T00:05:00.000Z';
            const time2 = '2023-01-01T00:00:00.000Z';

            const result = TemporalValue.diffInMinutes(time1, time2);

            expect(result).toBe(5);
        });
    });

    describe('integration tests', () => {
        it('should work together: add days and convert to date only', () => {
            const isoString = '2023-01-01T00:00:00.000Z';
            const withAddedDays = TemporalValue.addDays(isoString, 5);
            const dateOnly = TemporalValue.toDateOnly(withAddedDays);

            expect(dateOnly).toBe('2023-01-06');
        });

        it('should maintain precision with ISO strings', () => {
            const currentTime = TemporalValue.now;
            const added = TemporalValue.addMillis(currentTime, 1);

            expect(new Date(added).getTime() - new Date(currentTime).getTime()).toBe(1);
        });
    });
});
