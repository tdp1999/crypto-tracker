import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { ASSET_TOKENS } from '@modules/asset/application/asset.token';
import { ITokenRepository } from '@modules/asset/application/ports/token-repository.out.port';
import { ERR_TOKEN_REFID_EXISTS, ERR_TOKEN_SYMBOL_EXISTS } from '@modules/asset/domain/asset.error';
import { Token, TokenCreateSchema } from '@modules/asset/domain/token.entity';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateTokenCommand {
    constructor(public readonly payload: { dto: unknown; userId: Id }) {}
}

@Injectable()
@CommandHandler(CreateTokenCommand)
export class CreateTokenCommandHandler implements ICommandHandler<CreateTokenCommand> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.TOKEN)
        private readonly tokenRepository: ITokenRepository,
    ) {}

    async execute(command: CreateTokenCommand): Promise<Id> {
        const { dto, userId } = command.payload;
        const { success, data, error } = TokenCreateSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'Token creation failed' });

        // Check symbol uniqueness
        const existingTokenBySymbol = await this.tokenRepository.findBySymbol(data.symbol);
        if (existingTokenBySymbol) {
            throw BadRequestError(ERR_TOKEN_SYMBOL_EXISTS, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Token creation failed',
            });
        }

        // Check refId uniqueness
        const existingTokenByRefId = await this.tokenRepository.findByRefId(data.refId);
        if (existingTokenByRefId) {
            throw BadRequestError(ERR_TOKEN_REFID_EXISTS, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Token creation failed',
            });
        }

        const token = Token.create(data, userId);
        const tokenId = await this.tokenRepository.add(token);

        return tokenId;
    }
}
