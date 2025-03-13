import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestEntity } from './test.entity';

@Injectable()
export class TestService {
    constructor(@InjectRepository(TestEntity) private readonly testRepository: Repository<TestEntity>) {}

    getTest() {
        return this.testRepository.find();
    }
}
