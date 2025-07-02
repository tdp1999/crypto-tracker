import { ProviderAction } from '@core/actions/provider.action';
import { RpcClientRepository } from '@core/decorators/client.rpc.decorator';
import { CLIENT_PROXY } from '@core/features/client/client.token';
import { IProviderDetails, IProviderPrice } from '@core/features/provider/provider-asset.entity';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { observableToPromise } from '@shared/utils/observable.util';
import { IPortfolioProviderRepository } from '../../application/ports/portfolio-provider-repository.out.port';

@Injectable()
@RpcClientRepository()
export class PortfolioProviderRepository implements IPortfolioProviderRepository {
    constructor(@Inject(CLIENT_PROXY) private readonly client: ClientProxy) {}

    async getTokenDetails(refId: string): Promise<IProviderDetails> {
        return await observableToPromise(this.client.send(ProviderAction.DETAILS, { id: refId }));
    }

    async getTokenPrices(refIds: string[]): Promise<IProviderPrice[]> {
        const idsString = refIds.join(',');
        return await observableToPromise(this.client.send(ProviderAction.PRICE, { ids: idsString }));
    }
}
