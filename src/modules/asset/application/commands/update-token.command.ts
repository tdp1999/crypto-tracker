import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ERR_TOKEN_NOT_FOUND, ERR_TOKEN_REFID_EXISTS, ERR_TOKEN_SYMBOL_EXISTS } from '../../domain/asset.error';
import { Token, TokenUpdateSchema } from '../../domain/token.entity';
import { ASSET_TOKENS } from '../asset.token';
import { ITokenRepository } from '../ports/token-repository.out.port';

export class UpdateTokenCommand {
    constructor(public readonly payload: { id: Id; dto: unknown; updatedById: Id }) {}
}

@Injectable()
@CommandHandler(UpdateTokenCommand)
export class UpdateTokenCommandHandler implements ICommandHandler<UpdateTokenCommand> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.TOKEN)
        private readonly tokenRepository: ITokenRepository,
    ) {}

    async execute(command: UpdateTokenCommand): Promise<boolean> {
        const { id, dto, updatedById } = command.payload;
        const { success, data, error } = TokenUpdateSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'Token update failed' });

        // Get existing entity
        const existingToken = await this.tokenRepository.findById(id);
        if (!existingToken) {
            throw NotFoundError(ERR_TOKEN_NOT_FOUND, { layer: ErrorLayer.APPLICATION });
        }

        // Check symbol uniqueness if symbol is being updated
        if (data.symbol && data.symbol.toUpperCase() !== existingToken.symbol) {
            const tokenWithSameSymbol = await this.tokenRepository.findBySymbol(data.symbol);
            if (tokenWithSameSymbol) {
                throw BadRequestError(ERR_TOKEN_SYMBOL_EXISTS, {
                    layer: ErrorLayer.APPLICATION,
                    remarks: 'Token update failed',
                });
            }
        }

        // Check refId uniqueness if refId is being updated
        if (data.refId && data.refId !== existingToken.refId) {
            const tokenWithSameRefId = await this.tokenRepository.findByRefId(data.refId);
            if (tokenWithSameRefId) {
                throw BadRequestError(ERR_TOKEN_REFID_EXISTS, {
                    layer: ErrorLayer.APPLICATION,
                    remarks: 'Token update failed',
                });
            }
        }

        // Use domain entity to apply updates with domain logic
        const updatedToken = Token.update(existingToken, data, updatedById);

        // Pass full entity directly to repository
        return await this.tokenRepository.update(id, updatedToken);
    }
}
