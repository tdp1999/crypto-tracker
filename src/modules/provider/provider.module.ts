import { ClientModule } from '@core/features/client/client.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ProviderService } from './application/provider.service';
import { PROVIDER_ADAPTER_TOKEN, PROVIDER_SERVICE_TOKEN } from './application/provider.token';
import { CoinGeckoAdapter } from './infrastructure/coingecko/coingecko.adapter';
import { ProviderController } from './infrastructure/provider.controller';
import { ProviderRpcController } from './infrastructure/provider.rpc';

@Module({
    imports: [HttpModule, ClientModule.registerAsync()],
    controllers: [ProviderController, ProviderRpcController],
    providers: [
        {
            provide: PROVIDER_ADAPTER_TOKEN,
            useClass: CoinGeckoAdapter,
        },
        {
            provide: PROVIDER_SERVICE_TOKEN,
            useClass: ProviderService,
        },
    ],
})
export class ProviderModule {}
