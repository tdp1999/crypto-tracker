import { BasePersistence } from '@core/abstractions/persistence.base';
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { AssetPersistence } from './asset.persistence';

@Entity('asset_targets')
@Index('IDX_asset_targets_asset_id', ['assetId'])
export class AssetTargetPersistence extends BasePersistence {
    @Column({ name: 'asset_id', type: 'uuid' })
    assetId: string;

    @OneToOne(() => AssetPersistence, (asset) => asset.target, {
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: 'asset_id' })
    asset?: AssetPersistence;

    @Column({ name: 'target_value', type: 'numeric' })
    targetValue: number;
}
