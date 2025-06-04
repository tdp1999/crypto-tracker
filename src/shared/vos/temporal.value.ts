export abstract class TemporalValue {
    static get now(): bigint {
        return BigInt(Date.now());
    }

    static isoStringToTimestamp(isoString: string): bigint {
        return BigInt(new Date(isoString).getTime());
    }

    static addMillis(value: bigint, millis: number): bigint {
        return value + BigInt(millis);
    }
}
