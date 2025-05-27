import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from '../infrastructure/portfolio.controller';

describe('PortfolioController', () => {
    let controller: PortfolioController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PortfolioController],
            providers: [
                {
                    provide: CommandBus,
                    useValue: { execute: jest.fn() },
                },
                {
                    provide: QueryBus,
                    useValue: { execute: jest.fn() },
                },
            ],
        }).compile();

        controller = module.get<PortfolioController>(PortfolioController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
