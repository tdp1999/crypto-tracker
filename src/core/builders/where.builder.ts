import { NilValue } from '@shared/vos/nil.value';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

// Only for the sake of studying builder pattern. This is overkill
export class WhereBuilder<Entity extends ObjectLiteral> {
    private paramIndex = 0; // Counter for unique parameter names

    private constructor(
        private qb: SelectQueryBuilder<Entity>,
        private alias: string,
    ) {}

    public static create<Entity extends ObjectLiteral>(qb: SelectQueryBuilder<Entity>, alias: string = 'entity') {
        return new WhereBuilder(qb.where(`${alias}.deletedAt IS NULL`), alias);
    }

    // Generates a unique parameter name
    private getParamName(baseName: string): string {
        this.paramIndex++;
        return `${baseName}_${this.paramIndex}`;
    }

    public like(column: keyof Entity, value?: string): this {
        if (NilValue.isNil(value)) return this;
        const paramName = this.getParamName(String(column));
        this.qb.andWhere(`${this.alias}.${String(column)} LIKE :${paramName}`, { [paramName]: `%${value}%` });
        return this;
    }

    public orLike(columns: (keyof Entity)[], keyword?: string): this {
        if (NilValue.isNil(keyword)) return this;
        const paramName = this.getParamName('keyword'); // Unique name for the keyword parameter
        const conditions = columns.map((column) => `${this.alias}.${String(column)} LIKE :${paramName}`).join(' OR ');
        this.qb.andWhere(`(${conditions})`, { [paramName]: `%${keyword}%` }); // Wrap conditions in parentheses
        return this;
    }

    public equal(column: keyof Entity, value?: any): this {
        if (NilValue.isNil(value)) return this;
        const paramName = this.getParamName(String(column));
        this.qb.andWhere(`${this.alias}.${String(column)} = :${paramName}`, { [paramName]: value as string });
        return this;
    }

    public notEqual(column: keyof Entity, value?: any): this {
        if (NilValue.isNil(value)) return this;
        const paramName = this.getParamName(String(column));
        this.qb.andWhere(`${this.alias}.${String(column)} != :${paramName}`, { [paramName]: value as string });
        return this;
    }

    public in(column: keyof Entity, values?: any[]): this {
        if (!values || values.length === 0) return this;
        // TypeORM handles ':...values' correctly, ensuring unique internal parameters
        const paramName = this.getParamName(String(column) + 's'); // Still good practice to have a unique base name
        this.qb.andWhere(`${this.alias}.${String(column)} IN (:...${paramName})`, { [paramName]: values });
        return this;
    }

    public notIn(column: keyof Entity, values?: any[]): this {
        if (!values || values.length === 0) return this;
        // TypeORM handles ':...values' correctly
        const paramName = this.getParamName(String(column) + 's');
        this.qb.andWhere(`${this.alias}.${String(column)} NOT IN (:...${paramName})`, { [paramName]: values });
        return this;
    }

    public apply(filters: Partial<Entity>): this {
        Object.entries(filters).forEach(([key, value]) => {
            // Check for undefined or null explicitly
            if (value === undefined || value === null) return;

            // Existing logic seems okay now that like/equal use unique params
            if (typeof value === 'string') {
                // Consider if exact match might be needed sometimes?
                this.like(key as keyof Entity, value);
            } else if (Array.isArray(value)) {
                // Add handling for arrays, default to IN?
                this.in(key as keyof Entity, value);
            } else {
                this.equal(key as keyof Entity, value);
            }
        });
        return this;
    }

    public build(): SelectQueryBuilder<Entity> {
        return this.qb;
    }
}
