export abstract class TemporalValue {
    static get now(): string {
        return new Date().toISOString();
    }

    static addMillis(isoString: string, millis: number): string {
        const date = new Date(isoString);
        date.setMilliseconds(date.getMilliseconds() + millis);
        return date.toISOString();
    }

    static addDays(isoString: string, days: number): string {
        const date = new Date(isoString);
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    static toDateOnly(isoString: string): string {
        return new Date(isoString).toISOString().split('T')[0];
    }

    static fromDateOnly(dateString: string): string {
        return new Date(dateString + 'T00:00:00.000Z').toISOString();
    }

    static isAfter(isoString1: string, isoString2: string): boolean {
        return new Date(isoString1) > new Date(isoString2);
    }

    static isBefore(isoString1: string, isoString2: string): boolean {
        return new Date(isoString1) < new Date(isoString2);
    }

    static diffInMinutes(isoString1: string, isoString2: string): number {
        const date1 = new Date(isoString1);
        const date2 = new Date(isoString2);
        return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60);
    }
}
