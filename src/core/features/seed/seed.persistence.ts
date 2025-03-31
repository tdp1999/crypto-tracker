import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('seeds')
export class SeedEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ default: false })
    isCompleted: boolean;

    @Column({ type: 'bigint', name: 'executed_at' })
    executedAt: bigint;
}
