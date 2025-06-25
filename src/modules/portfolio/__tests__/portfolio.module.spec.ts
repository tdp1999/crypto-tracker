import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PortfolioModule } from '../portfolio.module';
import { PortfolioEntity } from '../infrastructure/persistence/portfolio.persistence';

describe('PortfolioModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [PortfolioModule],
        })
            .overrideProvider(getRepositoryToken(PortfolioEntity))
            .useValue({})
            .compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    afterEach(async () => {
        await module.close();
    });
});
