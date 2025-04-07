import { Id } from '../types/common.type';

export abstract class BaseModel {
    readonly id: string;

    readonly createdAt: bigint;
    readonly createdById: Id;

    readonly updatedAt: bigint;
    readonly updatedById: Id;

    readonly deletedAt?: bigint;
    readonly deletedById?: Id;

    protected constructor(props: Record<string, any>) {
        Object.assign(this, props);
    }
}
