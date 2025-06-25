import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { Test, TestingModule } from '@nestjs/testing';
import { IProviderService } from '@modules/provider/application/provider-service.in';
import { PROVIDER_SERVICE_TOKEN } from '@modules/provider/application/provider.token';
import { PortfolioHolding } from '../../../domain/entities/portfolio-holding.entity';
import { IPortfolioRepository } from '../../ports/portfolio-repository.out.port';
import { PORTFOLIO_TOKENS } from '../../portfolio.token';
import { RegisterTokenCommandHandler, RegisterTokenCommandPayload } from '../register-token.command';

describe('RegisterTokenCommandHandler', () => {
    let handler: RegisterTokenCommandHandler;
    let portfolioRepository: jest.Mocked<IPortfolioRepository>;
    let providerService: jest.Mocked<IProviderService>;

    const mockPortfolio = {
        id: 'portfolio-id',
        userId: 'user-id',
        name: 'Test Portfolio',
        isDefault: false,
    };

    const mockProviderAsset = {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        logo: 'https://example.com/btc.png',
        dataSource: 'coingecko' as const,
    };

    const mockTokenDetails = {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        categories: ['cryptocurrency'],
        logo: 'https://example.com/btc.png',
        price: 43000,
        marketCap: 850000000000,
        volumn24h: 25000000000,
        percentChange24h: 2.5,
        lastUpdated: '2025-01-01T00:00:00Z',
        dataSource: 'coingecko' as const,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegisterTokenCommandHandler,
                {
                    provide: PORTFOLIO_TOKENS.REPOSITORIES,
                    useValue: {
                        findById: jest.fn(),
                    },
                },
                {
                    provide: PROVIDER_SERVICE_TOKEN,
                    useValue: {
                        search: jest.fn(),
                        getDetails: jest.fn(),
                    },
                },
            ],
        }).compile();

        handler = module.get<RegisterTokenCommandHandler>(RegisterTokenCommandHandler);
        portfolioRepository = module.get(PORTFOLIO_TOKENS.REPOSITORIES);
        providerService = module.get(PROVIDER_SERVICE_TOKEN);
    });

    describe('execute', () => {
        it('should successfully register a new token', async () => {
            // Arrange
            const command = new RegisterTokenCommandPayload({
                portfolioId: 'portfolio-id',
                tokenSymbol: 'BTC',
                userId: 'user-id',
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);
            providerService.search.mockResolvedValue([mockProviderAsset]);
            providerService.getDetails.mockResolvedValue(mockTokenDetails);

            // Act
            const result = await handler.execute(command);

            // Assert
            expect(result).toBeInstanceOf(PortfolioHolding);
            expect(result.tokenSymbol).toBe('BTC');
            expect(result.tokenName).toBe('Bitcoin');
            expect(result.portfolioId).toBe('portfolio-id');
            expect(portfolioRepository.findById).toHaveBeenCalledWith('portfolio-id');
            expect(providerService.search).toHaveBeenCalledWith({ key: 'BTC' });
            expect(providerService.getDetails).toHaveBeenCalledWith({ id: 'bitcoin' });
        });

        it('should throw BadRequestError for invalid token symbol', async () => {
            // Arrange
            const command = new RegisterTokenCommandPayload({
                portfolioId: 'portfolio-id',
                tokenSymbol: 'invalid-symbol-with-special-chars!',
                userId: 'user-id',
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);

            // Act & Assert
            await expect(handler.execute(command)).rejects.toThrow(BadRequestError);
        });

        it('should throw NotFoundError when portfolio not found', async () => {
            // Arrange
            const command = new RegisterTokenCommandPayload({
                portfolioId: 'non-existent-portfolio',
                tokenSymbol: 'BTC',
                userId: 'user-id',
            });

            portfolioRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(handler.execute(command)).rejects.toThrow(NotFoundError);
        });

        it('should throw BadRequestError when user does not own portfolio', async () => {
            // Arrange
            const command = new RegisterTokenCommandPayload({
                portfolioId: 'portfolio-id',
                tokenSymbol: 'BTC',
                userId: 'different-user-id',
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);

            // Act & Assert
            await expect(handler.execute(command)).rejects.toThrow(BadRequestError);
        });

        it('should create token with minimal data when provider fails', async () => {
            // Arrange
            const command = new RegisterTokenCommandPayload({
                portfolioId: 'portfolio-id',
                tokenSymbol: 'UNKNOWN',
                userId: 'user-id',
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);
            providerService.search.mockRejectedValue(new Error('Provider failed'));

            // Act
            const result = await handler.execute(command);

            // Assert
            expect(result).toBeInstanceOf(PortfolioHolding);
            expect(result.tokenSymbol).toBe('UNKNOWN');
            expect(result.tokenName).toBeUndefined();
            expect(result.refId).toBe('unknown');
        });

        it('should correctly identify stablecoins', async () => {
            // Arrange
            const command = new RegisterTokenCommandPayload({
                portfolioId: 'portfolio-id',
                tokenSymbol: 'USDT',
                userId: 'user-id',
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);
            providerService.search.mockResolvedValue([{ ...mockProviderAsset, symbol: 'USDT' }]);
            providerService.getDetails.mockResolvedValue({ ...mockTokenDetails, symbol: 'USDT' });

            // Act
            const result = await handler.execute(command);

            // Assert
            expect(result.isStablecoin).toBe(true);
            expect(result.stablecoinPeg).toBe('USD');
        });

        it('should validate command input schema', async () => {
            // Arrange
            const invalidCommand = new RegisterTokenCommandPayload({
                portfolioId: 'invalid-uuid',
                tokenSymbol: '',
                userId: 'user-id',
            });

            // Act & Assert
            await expect(handler.execute(invalidCommand)).rejects.toThrow(BadRequestError);
        });
    });
});
