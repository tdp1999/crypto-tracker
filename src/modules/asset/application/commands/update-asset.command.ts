import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { ERR_ASSET_ACCESS_DENIED, ERR_ASSET_NOT_FOUND } from '../../domain/asset.error';
import { ASSET_TOKENS } from '../asset.token';
import { IAssetRepository } from '../ports/asset-repository.out.port';
import { AssetUpdateSchema } from '../schemas/asset.schema';
import { AssetTargetUpdateSchema } from '../schemas/asset-target.schema';

export class UpdateAssetCommand implements ICommand {
    constructor(public readonly payload: { id: Id; dto: unknown; userId: Id }) {}
}

@CommandHandler(UpdateAssetCommand)
export class UpdateAssetCommandHandler implements ICommandHandler<UpdateAssetCommand, boolean> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.ASSET)
        private readonly assetRepository: IAssetRepository,
    ) {}

    async execute(command: UpdateAssetCommand): Promise<boolean> {
        const { id, dto, userId } = command.payload;

        // Validate payload
        const { success, error, data } = AssetUpdateSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'Asset update failed' });

        // Get existing asset
        const existing = await this.assetRepository.findById(id);
        if (!existing) throw NotFoundError(ERR_ASSET_NOT_FOUND, { layer: ErrorLayer.APPLICATION });

        // Validate ownership
        if (existing.props.userId !== userId)
            throw BadRequestError(ERR_ASSET_ACCESS_DENIED, { layer: ErrorLayer.APPLICATION });

        const {
            success: targetSuccess,
            error: targetError,
            data: targetData,
        } = AssetTargetUpdateSchema.safeParse(data.target);

        if (!targetSuccess)
            throw BadRequestError(targetError, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Asset target update failed',
            });

        const payload = {
            ...data,
            target: targetSuccess ? targetData : undefined,
        };

        const updatedAsset = existing.update(payload, userId);
        return await this.assetRepository.update(id, updatedAsset);
    }
}
