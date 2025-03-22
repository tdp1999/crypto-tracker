import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('test_entity')
export class TestEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
