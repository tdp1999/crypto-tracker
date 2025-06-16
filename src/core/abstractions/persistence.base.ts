import {
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Column,
    PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class BasePersistence extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: string;

    @Column({ type: 'uuid', name: 'created_by_id' })
    createdById: string;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: string;

    @Column({ type: 'uuid', name: 'updated_by_id' })
    updatedById: string;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: string | null;

    @Column({ type: 'uuid', name: 'deleted_by_id', nullable: true })
    deletedById?: string | null;
}
