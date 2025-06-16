import { ProviderAction } from '@core/actions/provider.action';
import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { CLIENT_PROXY } from '@core/features/client/client.token';
import { ITokenPriceRepository } from '@modules/asset/application/ports/token-price-repository.out.port';
import { ITokenPrice, ITokenProviderPrice, TokenPrice } from '@modules/asset/domain/token-price.entity';
import { TokenPricePersistence } from '@modules/asset/infrastructure/persistence/token-price.persistence';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { observableToPromise } from '@shared/utils/observable.util';
import { Repository } from 'typeorm';

@Injectable()
export class TokenPriceRepository implements ITokenPriceRepository {
    constructor(
        @Inject(CLIENT_PROXY) private readonly client: ClientProxy,

        @InjectRepository(TokenPricePersistence)
        private readonly tokenPriceRepository: Repository<TokenPricePersistence>,
    ) {}

    async upsert(tokenId: string, priceData: ITokenPrice): Promise<boolean> {
        try {
            // Try to find existing
            const existing = await this.tokenPriceRepository.findOne({
                where: { tokenId },
            });

            if (existing) {
                const entity = this.tokenPriceRepository.create({ ...priceData, tokenId });
                await this.tokenPriceRepository.save(entity);
                return true;
            } else {
                const entity = this.tokenPriceRepository.create({ ...priceData, tokenId });
                await this.tokenPriceRepository.save(entity);
                return true;
            }
        } catch (error: unknown) {
            throw BadRequestError(`Failed to upsert token price: ${String(error)}`, {
                layer: ErrorLayer.INFRASTRUCTURE,
                remarks: 'Failed to upsert token price',
            });
        }
    }

    async findByTokenId(tokenId: string): Promise<ITokenPrice | null> {
        const entity = await this.tokenPriceRepository.findOne({ where: { tokenId } });
        return entity ? this._toDomain(entity) : null;
    }

    async findStale(olderThan: string): Promise<ITokenPrice[]> {
        const entities = await this.tokenPriceRepository
            .createQueryBuilder('tp')
            .where('tp.updated_at < :threshold', { threshold: olderThan })
            .getMany();

        return entities.map((entity) => this._toDomain(entity));
    }

    async findByDataSource(dataSource: string): Promise<ITokenPrice[]> {
        const entities = await this.tokenPriceRepository.find({
            where: { dataSource },
            order: { updatedAt: 'DESC' },
        });

        return entities.map((entity) => this._toDomain(entity));
    }

    async getLatestPrice(refId: string): Promise<Partial<ITokenPrice> | null> {
        const result: ITokenProviderPrice[] = await observableToPromise(
            this.client.send(ProviderAction.PRICE, { refId }),
        );
        if (!result || result.length === 0) return null;

        return TokenPrice.fromProviderPrice(result[0]);
    }

    private _toDomain(entity: TokenPricePersistence): TokenPrice {
        return TokenPrice.fromPersistence(entity);
    }
}
