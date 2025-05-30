import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { IToken } from '@modules/asset/domain/token.entity';
import { ERR_TOKEN_NOT_FOUND } from '@modules/asset/domain/asset.error';
import { ITokenRepository } from '@modules/asset/application/ports/token-repository.out.port';
import { ASSET_TOKENS } from '@modules/asset/application/asset.token';

export class GetTokenQuery {
    constructor(public readonly tokenId: Id) {}
}

@Injectable()
@QueryHandler(GetTokenQuery)
export class GetTokenQueryHandler implements IQueryHandler<GetTokenQuery> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.TOKEN)
        private readonly tokenRepository: ITokenRepository,
    ) {}

    async execute(query: GetTokenQuery): Promise<IToken> {
        const { tokenId } = query;

        const token = await this.tokenRepository.findById(tokenId);
        if (!token) {
            throw NotFoundError(ERR_TOKEN_NOT_FOUND, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Token retrieval failed',
            });
        }

        return token;
    }
}
