import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Asset } from '../../domain/entities/asset.entity';
import { ASSET_TOKENS } from '../asset.token';
import { IAssetRepository } from '../ports/asset-repository.out.port';
import { AssetTargetCreateSchema } from '../schemas/asset-target.schema';
import { AssetCreateSchema } from '../schemas/asset.schema';

export class CreateAssetCommand implements ICommand {
    constructor(public readonly payload: { dto: unknown; userId: Id }) {}
}

@CommandHandler(CreateAssetCommand)
export class CreateAssetCommandHandler implements ICommandHandler<CreateAssetCommand, Id> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.ASSET)
        private readonly assetRepository: IAssetRepository,
    ) {}

    async execute(command: CreateAssetCommand): Promise<Id> {
        const { dto, userId } = command.payload;
        const { success, data, error } = AssetCreateSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'Asset creation failed' });

        const {
            success: targetSuccess,
            error: targetError,
            data: targetData,
        } = AssetTargetCreateSchema.safeParse(data.target);

        if (!targetSuccess)
            throw BadRequestError(targetError, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Asset target creation failed',
            });

        const payload = {
            ...data,
            target: targetSuccess ? targetData : undefined,
        };

        const model = Asset.create(payload, userId, userId);
        return await this.assetRepository.add(model);
    }
}
