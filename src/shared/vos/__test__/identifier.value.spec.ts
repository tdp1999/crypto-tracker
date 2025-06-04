import { IdentifierValue } from '../identifier.value';

describe('IdentifierValue', () => {
    describe('v7', () => {
        it('should return a string', () => {
            const result = IdentifierValue.v7();

            expect(typeof result).toBe('string');
        });

        it('should return a valid UUID v7 format', () => {
            const result = IdentifierValue.v7();
            // UUID v7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
            const uuidV7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(result).toMatch(uuidV7Regex);
        });

        it('should generate unique identifiers', () => {
            const id1 = IdentifierValue.v7();
            const id2 = IdentifierValue.v7();
            const id3 = IdentifierValue.v7();

            expect(id1).not.toBe(id2);
            expect(id2).not.toBe(id3);
            expect(id1).not.toBe(id3);
        });

        it('should have correct length (36 characters including hyphens)', () => {
            const result = IdentifierValue.v7();

            expect(result.length).toBe(36);
        });

        it('should contain exactly 4 hyphens in correct positions', () => {
            const result = IdentifierValue.v7();

            expect(result.charAt(8)).toBe('-');
            expect(result.charAt(13)).toBe('-');
            expect(result.charAt(18)).toBe('-');
            expect(result.charAt(23)).toBe('-');
            expect(result.split('-').length).toBe(5);
        });

        it('should have version 7 identifier', () => {
            const result = IdentifierValue.v7();
            // Position 14 should be '7' for UUID v7
            expect(result.charAt(14)).toBe('7');
        });

        it('should have valid variant bits', () => {
            const result = IdentifierValue.v7();
            // Position 19 should be one of 8, 9, a, or b for RFC 4122 variant
            const variantChar = result.charAt(19).toLowerCase();
            expect(['8', '9', 'a', 'b']).toContain(variantChar);
        });

        it('should generate multiple different UUIDs in sequence', () => {
            const ids = Array.from({ length: 100 }, () => IdentifierValue.v7());
            const uniqueIds = new Set(ids);

            expect(uniqueIds.size).toBe(100);
        });

        it('should contain only valid hexadecimal characters and hyphens', () => {
            const result = IdentifierValue.v7();
            const validCharsRegex = /^[0-9a-f-]+$/i;

            expect(result).toMatch(validCharsRegex);
        });

        it('should be timestamp-based (v7 property)', () => {
            // UUID v7 includes timestamp, so consecutive calls should be ordered
            const id1 = IdentifierValue.v7();
            const id2 = IdentifierValue.v7();

            // Extract timestamp parts for comparison (first 12 characters without hyphens)
            const timestamp1 = id1.replace(/-/g, '').substring(0, 12);
            const timestamp2 = id2.replace(/-/g, '').substring(0, 12);

            // Second timestamp should be >= first timestamp
            expect(parseInt(timestamp2, 16)).toBeGreaterThanOrEqual(parseInt(timestamp1, 16));
        });
    });
});
