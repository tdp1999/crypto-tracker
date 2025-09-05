import { Id } from '../types/common.type';

export interface IBaseModelProps {
    id: Id;
    createdAt: string;
    createdById: Id;
    updatedAt: string;
    updatedById: Id;
    deletedAt?: string | null;
    deletedById?: Id | null;
}

export abstract class BaseModel {
    readonly id: Id;

    readonly createdAt: string;
    readonly createdById: Id;

    readonly updatedAt: string;
    readonly updatedById: Id;

    readonly deletedAt?: string | null;
    readonly deletedById?: Id | null;

    protected constructor(props: Record<string, any>) {
        Object.assign(this, props);
    }
}
