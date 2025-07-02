import { Requester } from '@core/decorators/requester.decorator';
import { IUser } from '@core/features/user/user.entity';
import { Id } from '@core/types/common.type';
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterTokenCommand } from '../../application/commands/register-token.command';
import { RemoveTokenCommand } from '../../application/commands/remove-token.command';
import { GetPortfolioHoldingsQuery } from '../../application/queries/get-portfolio-holdings.query';
import { PortfolioHolding } from '../../domain/entities/portfolio-holding.entity';

@Controller('portfolio/:portfolioId/holdings')
export class PortfolioHoldingController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Register a new token in the portfolio
     * POST /portfolios/:portfolioId/holdings
     * Body: { "refId": "bitcoin" }
     */
    @Post()
    async registerToken(
        @Param('portfolioId') portfolioId: string,
        @Body() body: unknown,
        @Requester() user: IUser,
    ): Promise<Id> {
        return await this.commandBus.execute<RegisterTokenCommand, Id>(
            new RegisterTokenCommand({ dto: body, userId: user.id, portfolioId }),
        );
    }

    /**
     * Get portfolio holdings with calculated metrics
     * GET /portfolios/:portfolioId/holdings?includePrices=true
     */
    @Get()
    async getHoldings(
        @Param('portfolioId') portfolioId: string,
        @Requester() user: IUser,
        @Query('includePrices') includePrices?: boolean,
    ): Promise<PortfolioHolding[]> {
        return await this.queryBus.execute<GetPortfolioHoldingsQuery, PortfolioHolding[]>(
            new GetPortfolioHoldingsQuery({
                portfolioId,
                userId: user.id,
                queries: { includePrices: includePrices || false },
            }),
        );
    }

    /**
     * Remove a token from the portfolio (soft delete)
     * DELETE /portfolios/:portfolioId/holdings/:holdingId
     */
    @Delete(':holdingId')
    async removeToken(
        @Param('portfolioId') portfolioId: string,
        @Param('holdingId') holdingId: string,
        @Requester() user: IUser,
    ): Promise<boolean> {
        return await this.commandBus.execute<RemoveTokenCommand, boolean>(
            new RemoveTokenCommand({ dto: { holdingId }, userId: user.id, portfolioId }),
        );
    }
}
