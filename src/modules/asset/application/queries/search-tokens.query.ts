import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { ITokenRepository } from '@modules/asset/application/ports/token-repository.out.port';
import { TokenSearchResponseDto, TokenSearchSchema } from '@modules/asset/application/asset.dto';
import { ASSET_TOKENS } from '@modules/asset/application/asset.token';

export class SearchTokensQuery {
    constructor(public readonly dto: unknown) {}
}

@Injectable()
@QueryHandler(SearchTokensQuery)
export class SearchTokensQueryHandler implements IQueryHandler<SearchTokensQuery> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.TOKEN)
        private readonly tokenRepository: ITokenRepository,
    ) {}

    async execute(query: SearchTokensQuery): Promise<TokenSearchResponseDto> {
        const { dto } = query;
        const { success, data, error } = TokenSearchSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'Token search failed' });

        const tokens = await this.tokenRepository.list(data);

        return {
            tokens: tokens.map((token) => ({
                id: token.id,
                symbol: token.symbol,
                name: token.name,
                refId: token.refId,
                decimals: token.decimals,
                isActive: token.isActive,
                isStablecoin: token.isStablecoin,
                stablecoinPeg: token.stablecoinPeg,
                logoUrl: token.logoUrl,
                createdAt: new Date(Number(token.createdAt)).toISOString(),
                updatedAt: new Date(Number(token.updatedAt)).toISOString(),
            })),
            total: tokens.length,
            limit: data.limit || 10,
        };
    }
}
