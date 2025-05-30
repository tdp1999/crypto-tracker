import { IToken } from '@modules/asset/domain/token.entity';
import { IRepository } from '@core/interfaces/repository.interface';
import { SearchTokensDto } from '@modules/asset/application/asset.dto';

export type ITokenRepository = IRepository<IToken, SearchTokensDto> & {
    findBySymbol(symbol: string): Promise<IToken | null>;
    findByRefId(refId: string): Promise<IToken | null>;
    findActiveTokens(): Promise<IToken[]>;
    searchByName(query: string, limit?: number): Promise<IToken[]>;
};
