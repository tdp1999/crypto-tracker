import { IRepository } from '@core/interfaces/repository.interface';
import { Id } from '@core/types/common.type';
import { AssetQueryDto } from '../../application/asset.dto';
import { Asset } from '../../domain/entities/asset.entity';

export type IAssetRepository = IRepository<Asset, AssetQueryDto> & {
    findByUserId(userId: Id, query: AssetQueryDto): Promise<Asset[]>;
};
