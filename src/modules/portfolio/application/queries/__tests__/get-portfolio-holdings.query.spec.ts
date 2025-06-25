import { BadRequestError } from '@core/errors/domain.error';
import { Test, TestingModule } from '@nestjs/testing';
import { IProviderService } from '@modules/provider/application/provider-service.in';
import { PROVIDER_SERVICE_TOKEN } from '@modules/provider/application/provider.token';
import { IPortfolioRepository } from '../../ports/portfolio-repository.out.port';
import { PORTFOLIO_TOKENS } from '../../portfolio.token';
import { GetPortfolioHoldingsQueryHandler, GetPortfolioHoldingsQueryPayload } from '../get-portfolio-holdings.query';

describe('GetPortfolioHoldingsQueryHandler', () => {
    let handler: GetPortfolioHoldingsQueryHandler;
    let portfolioRepository: jest.Mocked<IPortfolioRepository>;
    let providerService: jest.Mocked<IProviderService>;

    const mockPortfolio = {
        id: 'portfolio-id',
        userId: 'user-id',
        name: 'Test Portfolio',
        isDefault: false,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetPortfolioHoldingsQueryHandler,
                {
                    provide: PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO,
                    useValue: {
                        findById: jest.fn(),
                    },
                },
                {
                    provide: PROVIDER_SERVICE_TOKEN,
                    useValue: {
                        getPrice: jest.fn(),
                    },
                },
            ],
        }).compile();

        handler = module.get<GetPortfolioHoldingsQueryHandler>(GetPortfolioHoldingsQueryHandler);
        portfolioRepository = module.get(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO);
        providerService = module.get(PROVIDER_SERVICE_TOKEN);
    });

    describe('execute', () => {
        it('should return empty array when no holdings exist', async () => {
            // Arrange
            const query = new GetPortfolioHoldingsQueryPayload({
                portfolioId: 'portfolio-id',
                userId: 'user-id',
                includePrices: false,
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);

            // Act
            const result = await handler.execute(query);

            // Assert
            expect(result).toEqual([]);
            expect(portfolioRepository.findById).toHaveBeenCalledWith('portfolio-id');
        });

        it('should return holdings without prices when includePrices is false', async () => {
            // Arrange
            const query = new GetPortfolioHoldingsQueryPayload({
                portfolioId: 'portfolio-id',
                userId: 'user-id',
                includePrices: false,
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);

            // Act
            const result = await handler.execute(query);

            // Assert
            expect(result).toEqual([]);
            expect(providerService.getPrice).not.toHaveBeenCalled();
        });

        it('should handle includePrices true without calling provider when no holdings', async () => {
            // Arrange
            const query = new GetPortfolioHoldingsQueryPayload({
                portfolioId: 'portfolio-id',
                userId: 'user-id',
                includePrices: true,
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);

            // Act
            const result = await handler.execute(query);

            // Assert
            expect(result).toEqual([]);
            expect(providerService.getPrice).not.toHaveBeenCalled();
        });

        it('should throw BadRequestError when portfolio not found', async () => {
            // Arrange
            const query = new GetPortfolioHoldingsQueryPayload({
                portfolioId: 'non-existent-portfolio',
                userId: 'user-id',
                includePrices: false,
            });

            portfolioRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(handler.execute(query)).rejects.toThrow('Portfolio not found');
        });

        it('should throw BadRequestError when user does not own portfolio', async () => {
            // Arrange
            const query = new GetPortfolioHoldingsQueryPayload({
                portfolioId: 'portfolio-id',
                userId: 'different-user-id',
                includePrices: false,
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);

            // Act & Assert
            await expect(handler.execute(query)).rejects.toThrow('Access denied to portfolio');
        });

        it('should validate query input schema', async () => {
            // Arrange
            const invalidQuery = new GetPortfolioHoldingsQueryPayload({
                portfolioId: 'invalid-uuid',
                userId: '',
                includePrices: false,
            });

            // Act & Assert
            await expect(handler.execute(invalidQuery)).rejects.toThrow(BadRequestError);
        });

        it('should set default includePrices to false', () => {
            // Arrange & Act
            const query = new GetPortfolioHoldingsQueryPayload({
                portfolioId: 'portfolio-id',
                userId: 'user-id',
                // includePrices not specified
            } as any);

            // Assert
            expect(query.includePrices).toBe(false);
        });

        it('should accept includePrices as true', () => {
            // Arrange & Act
            const query = new GetPortfolioHoldingsQueryPayload({
                portfolioId: 'portfolio-id',
                userId: 'user-id',
                includePrices: true,
            });

            // Assert
            expect(query.includePrices).toBe(true);
        });
    });
});
