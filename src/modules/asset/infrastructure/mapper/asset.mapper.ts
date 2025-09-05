import { DeepPartial } from 'typeorm';
import { AssetTarget } from '../../domain/entities/asset-target.entity';
import { Asset } from '../../domain/entities/asset.entity';
import { AssetPersistence } from '../persistence/asset.persistence';

export class AssetMapper {
    static toDomain(entity: AssetPersistence): Asset {
        const target = entity.target ? AssetTarget.load(entity.target) : null;
        return Asset.load({ ...entity, target });
    }

    static toDomainArray(entities: AssetPersistence[]): Asset[] {
        return entities.map((e) => this.toDomain(e));
    }

    static toPersistence(domain: Asset): DeepPartial<AssetPersistence> {
        return { ...domain.props, target: domain.props?.target?.props ?? null };
    }
}
