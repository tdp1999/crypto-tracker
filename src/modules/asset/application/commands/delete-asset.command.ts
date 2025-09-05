import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Id } from '@core/types/common.type';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { ASSET_TOKENS } from '../asset.token';
import { IAssetRepository } from '../ports/asset-repository.out.port';
import { ERR_ASSET_ACCESS_DENIED, ERR_ASSET_NOT_FOUND } from '../../domain/asset.error';

export const DeleteAssetSchema = DetailQuerySchema;

export class DeleteAssetCommand implements ICommand {
    constructor(public readonly payload: { dto: unknown; userId: Id }) {}
}

@CommandHandler(DeleteAssetCommand)
export class DeleteAssetCommandHandler implements ICommandHandler<DeleteAssetCommand, boolean> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.ASSET)
        private readonly assetRepository: IAssetRepository,
    ) {}

    async execute(command: DeleteAssetCommand): Promise<boolean> {
        const { dto, userId } = command.payload;

        // Validate payload
        const { success, error, data } = DeleteAssetSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        // Get existing asset
        const existingAsset = await this.assetRepository.findById(data.id);
        if (!existingAsset) {
            throw NotFoundError(ERR_ASSET_NOT_FOUND, { layer: ErrorLayer.APPLICATION });
        }

        // Validate ownership
        if (existingAsset.props.userId !== userId)
            throw BadRequestError(ERR_ASSET_ACCESS_DENIED, { layer: ErrorLayer.APPLICATION });

        // Soft delete the asset
        const deletedAsset = existingAsset.delete(userId);
        return await this.assetRepository.remove(deletedAsset.props.id);
    }
}
