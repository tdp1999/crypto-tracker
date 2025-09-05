import { IBaseModelProps } from '@core/abstractions/model.base';
import { Id } from '@core/types/common.type';
import { IdentifierValue } from '@shared/vos/identifier.value';
import { TemporalValue } from '@shared/vos/temporal.value';
import { AssetStatusEnum, AssetTypeEnum } from '../enums/asset.enum';
import { AssetTarget, ICreateAssetTargetPayload, IUpdateAssetTargetPayload } from './asset-target.entity';

export interface IAssetProps extends IBaseModelProps {
    userId: Id;
    name: string;
    currentValue: number;
    type: AssetTypeEnum;
    location?: string | null;
    description?: string | null;
    target?: AssetTarget | null;
}

export type ICreateAssetPayload = Pick<IAssetProps, 'name' | 'currentValue' | 'type' | 'location' | 'description'> & {
    target?: ICreateAssetTargetPayload;
};

export type IUpdateAssetPayload = Partial<
    Omit<IAssetProps, 'id' | 'userId' | 'createdById' | 'createdAt' | 'target'>
> & {
    target?: IUpdateAssetTargetPayload;
};

export class Asset {
    readonly props: IAssetProps;

    private constructor(props: IAssetProps) {
        this.props = props;
    }

    /* Static Methods */
    static load(raw: IAssetProps): Asset {
        return new Asset(raw);
    }

    static create(data: ICreateAssetPayload, userId: Id, createdById: Id): Asset {
        const id = IdentifierValue.v7();
        const now = TemporalValue.now;

        let target: AssetTarget | null = null;
        if (data.target) {
            target = AssetTarget.create(data.target, id, createdById);
        }

        return new Asset({
            ...data,
            userId,
            id,
            createdById,
            updatedById: createdById,
            target,
            createdAt: now,
            updatedAt: now,
        });
    }

    /* Public Methods */
    public update(data: IUpdateAssetPayload, updatedById: Id): Asset {
        // If the payload have no target key, return the asset with the updated data
        if (!Object.prototype.hasOwnProperty.call(data, 'target')) {
            const newProps = { ...this.props, ...data, target: this.props.target, updatedById };
            return new Asset(newProps);
        }

        // If the payload have target key, and target is undefined, return the asset with the updated data
        if (!data.target) {
            const newProps = { ...this.props, ...data, target: null, updatedById };
            return new Asset(newProps);
        }

        // If the payload have target key, and targetValue, update the target
        const newTarget = this.props.target?.update(data.target, updatedById);
        const newProps = { ...this.props, ...data, target: newTarget, updatedById };

        return new Asset(newProps);
    }

    public delete(deletedById: Id): Asset {
        const newProps = { ...this.props, deletedById, deletedAt: TemporalValue.now, updatedById: deletedById };
        return new Asset(newProps);
    }

    /* Getters */
    /**
     * Calculate normalized progress [0..1] based on current value and target value
     */
    public get progress(): number | undefined {
        const { currentValue, target } = this.props;
        const { targetValue } = target?.props ?? {};

        if (!targetValue) return undefined;
        if (targetValue <= 0) return 0;

        const progress = currentValue / targetValue;
        return Math.max(0, Math.min(1, progress));
    }

    /**
     * Derive status from current value and target value using AssetStatusEnum
     */
    public get status(): AssetStatusEnum {
        const { targetValue } = this.props.target?.props ?? {};

        if (!targetValue) return AssetStatusEnum.UNDEFINED;
        if (targetValue === 0) return AssetStatusEnum.NOT_STARTED;

        const progress = this.progress ?? 0;
        return progress >= 1 ? AssetStatusEnum.DONE : AssetStatusEnum.IN_PROGRESS;
    }
}
