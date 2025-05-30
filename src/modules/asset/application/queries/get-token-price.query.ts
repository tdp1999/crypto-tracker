import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { ITokenPrice } from '@modules/asset/domain/token-price.entity';
import { ERR_TOKEN_PRICE_NOT_FOUND } from '@modules/asset/domain/asset.error';
import { ITokenPriceRepository } from '@modules/asset/application/ports/token-price-repository.out.port';
import { ASSET_TOKENS } from '@modules/asset/application/asset.token';

export class GetTokenPriceQuery {
    constructor(public readonly tokenId: Id) {}
}

@Injectable()
@QueryHandler(GetTokenPriceQuery)
export class GetTokenPriceQueryHandler implements IQueryHandler<GetTokenPriceQuery> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.TOKEN_PRICE)
        private readonly tokenPriceRepository: ITokenPriceRepository,
    ) {}

    async execute(query: GetTokenPriceQuery): Promise<ITokenPrice> {
        const { tokenId } = query;

        const tokenPrice = await this.tokenPriceRepository.findByTokenId(tokenId);
        if (!tokenPrice) {
            throw NotFoundError(ERR_TOKEN_PRICE_NOT_FOUND, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Token price retrieval failed',
            });
        }

        return tokenPrice;
    }
}
