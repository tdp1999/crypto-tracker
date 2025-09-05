import { IBaseModelProps } from '@core/abstractions/model.base';
import { Id } from '@core/types/common.type';
import { IdentifierValue } from '@shared/vos/identifier.value';
import { TemporalValue } from '@shared/vos/temporal.value';

export interface IAssetTargetProps extends IBaseModelProps {
    assetId: Id;
    targetValue: number;
}

export type ICreateAssetTargetPayload = Pick<IAssetTargetProps, 'targetValue'>;

export type IUpdateAssetTargetPayload = Partial<
    Omit<IAssetTargetProps, 'id' | 'assetId' | 'createdById' | 'createdAt'>
>;

export class AssetTarget {
    readonly props: IAssetTargetProps;

    private constructor(props: IAssetTargetProps) {
        this.props = props;
    }

    static load(raw: IAssetTargetProps): AssetTarget {
        return new AssetTarget(raw);
    }

    static create(data: ICreateAssetTargetPayload, assetId: Id, createdById: Id): AssetTarget {
        const now = TemporalValue.now;

        return new AssetTarget({
            ...data,
            assetId,
            id: IdentifierValue.v7(),
            createdById,
            updatedById: createdById,
            createdAt: now,
            updatedAt: now,
        });
    }

    public update(data: IUpdateAssetTargetPayload | null, updatedById: Id): AssetTarget | null {
        if (!data) return null;

        const newProps = { ...this.props, ...data, updatedById };

        return new AssetTarget(newProps);
    }
}
