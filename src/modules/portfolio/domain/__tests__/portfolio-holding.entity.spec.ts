import { BadRequestError } from '@core/errors/domain.error';
import { PortfolioHolding } from '../entities/portfolio-holding.entity';

describe('PortfolioHolding Domain Entity', () => {
    const mockPortfolioId = '01234567-89ab-cdef-0123-456789abcdef';
    const mockUserId = 'user-01234567-89ab-cdef-0123-456789abcdef';

    describe('create', () => {
        it('should create a valid portfolio holding with minimal data', () => {
            const tokenData = {
                tokenSymbol: 'BTC',
            };

            const holding = PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);

            expect(holding.portfolioId).toBe(mockPortfolioId);
            expect(holding.tokenSymbol).toBe('BTC');
            expect(holding.tokenDecimals).toBe(18); // default value
            expect(holding.isStablecoin).toBe(false); // default value
            expect(holding.createdById).toBe(mockUserId);
            expect(holding.updatedById).toBe(mockUserId);
            expect(holding.id).toBeDefined();
            expect(holding.isActive()).toBe(true);
        });

        it('should create a portfolio holding with complete token metadata', () => {
            const tokenData = {
                tokenSymbol: 'ETH',
                tokenName: 'Ethereum',
                tokenDecimals: 18,
                tokenLogoUrl: 'https://example.com/eth-logo.png',
                isStablecoin: false,
            };

            const holding = PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);

            expect(holding.tokenSymbol).toBe('ETH');
            expect(holding.tokenName).toBe('Ethereum');
            expect(holding.tokenDecimals).toBe(18);
            expect(holding.tokenLogoUrl).toBe('https://example.com/eth-logo.png');
            expect(holding.isStablecoin).toBe(false);
        });

        it('should create a stablecoin holding with peg information', () => {
            const tokenData = {
                tokenSymbol: 'USDC',
                tokenName: 'USD Coin',
                tokenDecimals: 6,
                isStablecoin: true,
                stablecoinPeg: 'USD',
            };

            const holding = PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);

            expect(holding.isStablecoin).toBe(true);
            expect(holding.stablecoinPeg).toBe('USD');
            expect(holding.isStablecoinHolding()).toBe(true);
            expect(holding.getStablecoinPeg()).toBe('USD');
        });

        it('should automatically uppercase token symbols', () => {
            const tokenData = {
                tokenSymbol: 'btc',
            };

            const holding = PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);

            expect(holding.tokenSymbol).toBe('BTC');
        });

        it('should throw error for invalid token symbol - too long', () => {
            const tokenData = {
                tokenSymbol: 'VERYLONGTOKENSYMBOLNAME',
            };

            expect(() => {
                PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);
            }).toThrow();
        });

        it('should throw error for invalid token symbol - empty', () => {
            const tokenData = {
                tokenSymbol: '',
            };

            expect(() => {
                PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);
            }).toThrow();
        });

        it('should throw error for invalid URL format', () => {
            const tokenData = {
                tokenSymbol: 'BTC',
                tokenLogoUrl: 'not-a-valid-url',
            };

            expect(() => {
                PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);
            }).toThrow(BadRequestError);
        });

        it('should throw error for invalid token decimals - negative', () => {
            const tokenData = {
                tokenSymbol: 'BTC',
                tokenDecimals: -1,
            };

            expect(() => {
                PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);
            }).toThrow(BadRequestError);
        });

        it('should throw error for invalid token decimals - too high', () => {
            const tokenData = {
                tokenSymbol: 'BTC',
                tokenDecimals: 19,
            };

            expect(() => {
                PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);
            }).toThrow(BadRequestError);
        });
    });

    describe('update', () => {
        let existingHolding: any;

        beforeEach(() => {
            existingHolding = {
                id: 'holding-123',
                portfolioId: mockPortfolioId,
                tokenSymbol: 'BTC',
                tokenName: 'Bitcoin',
                tokenDecimals: 8,
                isStablecoin: false,
                createdById: mockUserId,
                updatedById: mockUserId,
            };
        });

        it('should update token metadata successfully', () => {
            const updateData = {
                tokenName: 'Bitcoin (Updated)',
                tokenLogoUrl: 'https://example.com/btc-new-logo.png',
            };

            const updatedHolding = PortfolioHolding.update(existingHolding, updateData, mockUserId);

            expect(updatedHolding.tokenName).toBe('Bitcoin (Updated)');
            expect(updatedHolding.tokenLogoUrl).toBe('https://example.com/btc-new-logo.png');
            expect(updatedHolding.tokenSymbol).toBe('BTC'); // Should not change
            expect(updatedHolding.updatedById).toBe(mockUserId);
        });

        it('should update stablecoin status', () => {
            const updateData = {
                isStablecoin: true,
                stablecoinPeg: 'USD',
            };

            const updatedHolding = PortfolioHolding.update(existingHolding, updateData, mockUserId);

            expect(updatedHolding.isStablecoin).toBe(true);
            expect(updatedHolding.stablecoinPeg).toBe('USD');
        });

        it('should throw error for empty update data', () => {
            expect(() => {
                PortfolioHolding.update(existingHolding, {}, mockUserId);
            }).toThrow(BadRequestError);
        });

        it('should throw error for invalid URL in update', () => {
            const updateData = {
                tokenLogoUrl: 'not-a-valid-url',
            };

            expect(() => {
                PortfolioHolding.update(existingHolding, updateData, mockUserId);
            }).toThrow(BadRequestError);
        });
    });

    describe('markDeleted', () => {
        it('should mark holding as deleted', () => {
            const existingHolding = {
                id: 'holding-123',
                portfolioId: mockPortfolioId,
                tokenSymbol: 'BTC',
                isActive: true,
            };

            const deletedHolding = PortfolioHolding.markDeleted(existingHolding, mockUserId);

            expect(deletedHolding.deletedAt).toBeDefined();
            expect(deletedHolding.deletedById).toBe(mockUserId);
            expect(deletedHolding.isActive()).toBe(false);
        });
    });

    describe('validateTokenSymbol', () => {
        it('should validate correct token symbols', () => {
            expect(PortfolioHolding.validateTokenSymbol('BTC')).toBe(true);
            expect(PortfolioHolding.validateTokenSymbol('ETH')).toBe(true);
            expect(PortfolioHolding.validateTokenSymbol('USDC')).toBe(true);
            expect(PortfolioHolding.validateTokenSymbol('BNB')).toBe(true);
            expect(PortfolioHolding.validateTokenSymbol('MATIC')).toBe(true);
        });

        it('should validate symbols with numbers', () => {
            expect(PortfolioHolding.validateTokenSymbol('UNI1')).toBe(true);
            expect(PortfolioHolding.validateTokenSymbol('SHIB2')).toBe(true);
        });

        it('should reject invalid token symbols', () => {
            expect(PortfolioHolding.validateTokenSymbol('btc')).toBe(false); // lowercase
            expect(PortfolioHolding.validateTokenSymbol('BTC-USD')).toBe(false); // hyphen
            expect(PortfolioHolding.validateTokenSymbol('BTC.USD')).toBe(false); // dot
            expect(PortfolioHolding.validateTokenSymbol('BTC USD')).toBe(false); // space
            expect(PortfolioHolding.validateTokenSymbol('')).toBe(false); // empty
            expect(PortfolioHolding.validateTokenSymbol('VERYLONGTOKENSYMBOLNAME')).toBe(false); // too long
        });
    });

    describe('utility methods', () => {
        let holding: PortfolioHolding;

        beforeEach(() => {
            const tokenData = {
                tokenSymbol: 'USDC',
                tokenName: 'USD Coin',
                isStablecoin: true,
                stablecoinPeg: 'USD',
            };
            holding = PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);
        });

        it('should return correct token identifier for API calls', () => {
            expect(holding.getTokenIdentifier()).toBe('usdc');
        });

        it('should identify stablecoin holdings', () => {
            expect(holding.isStablecoinHolding()).toBe(true);
            expect(holding.getStablecoinPeg()).toBe('USD');
        });

        it('should handle non-stablecoin holdings', () => {
            const tokenData = {
                tokenSymbol: 'BTC',
                isStablecoin: false,
            };
            const btcHolding = PortfolioHolding.create(mockPortfolioId, tokenData, mockUserId);

            expect(btcHolding.isStablecoinHolding()).toBe(false);
            expect(btcHolding.getStablecoinPeg()).toBeUndefined();
        });
    });
});
