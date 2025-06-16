import { Id } from '../types/common.type';

export abstract class BaseModel {
    readonly id: string;

    readonly createdAt: string;
    readonly createdById: Id;

    readonly updatedAt: string;
    readonly updatedById: Id;

    readonly deletedAt?: string;
    readonly deletedById?: Id;

    protected constructor(props: Record<string, any>) {
        Object.assign(this, props);
    }
}
