import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestController } from './test.controller';
import { TestEntity } from './test.entity';
import { TestService } from './test.service';

@Module({
    providers: [TestService],
    controllers: [TestController],
    imports: [TypeOrmModule.forFeature([TestEntity])],
})
export class TestModule {}
