import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('seeds')
export class SeedPersistence {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ default: false })
    isCompleted: boolean;

    @CreateDateColumn({ name: 'executed_at' })
    executedAt: string;
}
