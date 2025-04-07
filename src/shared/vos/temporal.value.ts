export abstract class TemporalValue {
    static get now(): bigint {
        return BigInt(Date.now());
    }

    static addMillis(value: bigint, millis: number): bigint {
        return value + BigInt(millis);
    }
}
