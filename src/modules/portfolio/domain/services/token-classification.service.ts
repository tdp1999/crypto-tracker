export enum TokenCategory {
    STABLECOIN = 'stablecoin',
    CRYPTOCURRENCY = 'cryptocurrency',
    // Future: DEFI = 'defi', MEME = 'meme', etc.
}

export class TokenClassificationService {
    private static readonly STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FRAX'];

    private static readonly EURO_STABLECOINS = ['EURS', 'EURT'];

    /**
     * Determines if a token symbol represents a stablecoin
     * @param symbol - The token symbol to check
     * @returns true if the token is classified as a stablecoin
     */
    static isStablecoin(symbol: string): boolean {
        return this.STABLECOINS.includes(symbol.toUpperCase());
    }

    /**
     * Gets the currency peg for a stablecoin
     * @param symbol - The stablecoin symbol
     * @returns The currency the stablecoin is pegged to, or undefined if not a stablecoin
     */
    static getStablecoinPeg(symbol: string): string | undefined {
        if (!this.isStablecoin(symbol)) return undefined;

        if (this.EURO_STABLECOINS.includes(symbol.toUpperCase())) {
            return 'EUR';
        }

        return 'USD'; // Default peg for most stablecoins
    }

    /**
     * Classifies a token into its primary category
     * @param symbol - The token symbol to classify
     * @returns The token category
     */
    static getTokenCategory(symbol: string): TokenCategory {
        if (this.isStablecoin(symbol)) {
            return TokenCategory.STABLECOIN;
        }

        // Future: Add more sophisticated classification logic
        // - DeFi tokens (UNI, AAVE, COMP, etc.)
        // - Meme coins (DOGE, SHIB, etc.)
        // - Layer 1 tokens (ETH, BTC, SOL, etc.)

        return TokenCategory.CRYPTOCURRENCY;
    }
}
