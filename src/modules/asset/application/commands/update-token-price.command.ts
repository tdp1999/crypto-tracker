import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { ASSET_TOKENS } from '@modules/asset/application/asset.token';
import { ITokenPriceRepository } from '@modules/asset/application/ports/token-price-repository.out.port';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PromiseValue } from '@shared/vos/promise.value';
import { TokenPrice, TokenPriceUpdateSchema } from '../../domain/token-price.entity';
export class UpdateTokenPriceCommand {
    constructor(public readonly payload: { tokenId: Id; priceData: unknown; userId: Id }) {}
}

@Injectable()
@CommandHandler(UpdateTokenPriceCommand)
export class UpdateTokenPriceCommandHandler implements ICommandHandler<UpdateTokenPriceCommand> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.TOKEN_PRICE)
        private readonly tokenPriceRepository: ITokenPriceRepository,
    ) {}

    async execute(command: UpdateTokenPriceCommand): Promise<void> {
        const { tokenId, priceData, userId } = command.payload;
        const { success, data, error } = TokenPriceUpdateSchema.safeParse(priceData);
        if (!success)
            throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'Token price update failed' });

        const tokenPrice = TokenPrice.create(data, userId);
        await this.tokenPriceRepository.upsert(tokenId, tokenPrice);

        console.log('UpdateTokenPriceCommandHandler', command);

        // TODO: Implement this
        return PromiseValue.Void();
    }
}
