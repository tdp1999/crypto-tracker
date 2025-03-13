export abstract class TemporalValue {
    static getNow(): bigint {
        return BigInt(Date.now());
    }

    static addMillis(value: bigint, millis: number): bigint {
        return value + BigInt(millis);
    }
}
