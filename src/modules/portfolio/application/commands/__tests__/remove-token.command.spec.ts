import { BadRequestError } from '@core/errors/domain.error';
import { Test, TestingModule } from '@nestjs/testing';
import { IPortfolioRepository } from '../../ports/portfolio-repository.out.port';
import { PORTFOLIO_TOKENS } from '../../portfolio.token';
import { RemoveTokenCommandHandler, RemoveTokenCommandPayload } from '../remove-token.command';

describe('RemoveTokenCommandHandler', () => {
    let handler: RemoveTokenCommandHandler;
    let portfolioRepository: jest.Mocked<IPortfolioRepository>;

    const mockPortfolio = {
        id: 'portfolio-id',
        userId: 'user-id',
        name: 'Test Portfolio',
        isDefault: false,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RemoveTokenCommandHandler,
                {
                    provide: PORTFOLIO_TOKENS.REPOSITORIES,
                    useValue: {
                        findById: jest.fn(),
                    },
                },
            ],
        }).compile();

        handler = module.get<RemoveTokenCommandHandler>(RemoveTokenCommandHandler);
        portfolioRepository = module.get(PORTFOLIO_TOKENS.REPOSITORIES);
    });

    describe('execute', () => {
        it('should successfully remove a token holding', async () => {
            // Arrange
            const command = new RemoveTokenCommandPayload({
                portfolioId: 'portfolio-id',
                holdingId: 'holding-id',
                userId: 'user-id',
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);

            // Mock console.log to verify the operation
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Act
            await handler.execute(command);

            // Assert
            expect(portfolioRepository.findById).toHaveBeenCalledWith('portfolio-id');
            expect(consoleSpy).toHaveBeenCalledWith(
                'Token holding holding-id marked for deletion from portfolio portfolio-id',
            );

            consoleSpy.mockRestore();
        });

        it('should throw NotFoundError when portfolio not found', async () => {
            // Arrange
            const command = new RemoveTokenCommandPayload({
                portfolioId: 'non-existent-portfolio',
                holdingId: 'holding-id',
                userId: 'user-id',
            });

            portfolioRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(handler.execute(command)).rejects.toThrow('Portfolio not found');
            expect(portfolioRepository.findById).toHaveBeenCalledWith('non-existent-portfolio');
        });

        it('should throw BadRequestError when user does not own portfolio', async () => {
            // Arrange
            const command = new RemoveTokenCommandPayload({
                portfolioId: 'portfolio-id',
                holdingId: 'holding-id',
                userId: 'different-user-id',
            });

            portfolioRepository.findById.mockResolvedValue(mockPortfolio as any);

            // Act & Assert
            await expect(handler.execute(command)).rejects.toThrow(BadRequestError);
            expect(portfolioRepository.findById).toHaveBeenCalledWith('portfolio-id');
        });

        it('should validate command input schema', async () => {
            // Arrange
            const invalidCommand = new RemoveTokenCommandPayload({
                portfolioId: 'invalid-uuid',
                holdingId: '',
                userId: 'user-id',
            });

            // Act & Assert
            await expect(handler.execute(invalidCommand)).rejects.toThrow(BadRequestError);
        });

        it('should handle valid UUID formats', async () => {
            // Arrange
            const command = new RemoveTokenCommandPayload({
                portfolioId: '123e4567-e89b-12d3-a456-426614174000',
                holdingId: '123e4567-e89b-12d3-a456-426614174001',
                userId: '123e4567-e89b-12d3-a456-426614174002',
            });

            portfolioRepository.findById.mockResolvedValue({
                ...mockPortfolio,
                id: '123e4567-e89b-12d3-a456-426614174000',
                userId: '123e4567-e89b-12d3-a456-426614174002',
            } as any);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Act
            await handler.execute(command);

            // Assert
            expect(portfolioRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
            expect(consoleSpy).toHaveBeenCalledWith(
                'Token holding 123e4567-e89b-12d3-a456-426614174001 marked for deletion from portfolio 123e4567-e89b-12d3-a456-426614174000',
            );

            consoleSpy.mockRestore();
        });
    });
});
