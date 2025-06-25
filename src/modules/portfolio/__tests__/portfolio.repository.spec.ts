import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioEntity } from '../infrastructure/persistence/portfolio.persistence';
import { PortfolioRepository } from '../infrastructure/portfolio.repository';

describe('PortfolioRepository', () => {
    let repository: PortfolioRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PortfolioRepository,
                {
                    provide: getRepositoryToken(PortfolioEntity),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                    } as Partial<Repository<PortfolioEntity>>,
                },
            ],
        }).compile();

        repository = module.get<PortfolioRepository>(PortfolioRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });
});
