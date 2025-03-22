import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ProviderService } from './application/provider.service';
import { PROVIDER_ADAPTER_TOKEN, PROVIDER_SERVICE_TOKEN } from './application/provider.token';
import { CoinGeckoAdapter } from './infrastructure/coingecko/coingecko.adapter';
import { ProviderController } from './infrastructure/provider.controller';

@Module({
    imports: [HttpModule],
    controllers: [ProviderController],
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
