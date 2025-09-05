import { BasePersistence } from '@core/abstractions/persistence.base';
import { Column, Entity, Index, OneToOne } from 'typeorm';
import { AssetTypeEnum } from '../../domain/enums/asset.enum';
import { AssetTargetPersistence } from './asset-target.persistence';

@Entity('assets')
@Index('IDX_assets_user_id', ['userId'])
export class AssetPersistence extends BasePersistence {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'current_value', type: 'numeric', default: 0 })
    currentValue: number;

    @Column({ name: 'type', type: 'varchar', length: 100 })
    type: AssetTypeEnum;

    @Column({ name: 'location', type: 'varchar', length: 255, nullable: true })
    location?: string | null;

    @Column({ name: 'description', type: 'text', nullable: true })
    description?: string | null;

    @OneToOne(() => AssetTargetPersistence, (target) => target.asset, {
        createForeignKeyConstraints: false,
        cascade: true,
        eager: true,
    })
    target?: AssetTargetPersistence | null;
}
