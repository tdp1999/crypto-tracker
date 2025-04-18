import { PaginatedResponse } from '@shared/types/pagination.type';
import { Conditions, Id } from '../types/common.type';
import { FindByIdsResult } from '../types/query.type';

export interface IRepositoryCommand<Add, Update> {
    add(data: Add): Promise<Id>;

    update(id: Id, data: Update): Promise<boolean>;

    remove(id: Id): Promise<boolean>;
}

export interface IRepositoryQuery<T, Search> {
    list(query?: Search): Promise<T[]>;

    paginatedList(query?: Search): Promise<PaginatedResponse<T>>;

    findById(id: Id): Promise<T | null>;

    findByIds(ids: Id[]): Promise<FindByIdsResult<T, Id>>;

    findOne(conditions: Conditions): Promise<T | null>;

    exists(id: Id): Promise<boolean>;
}

export interface IRepository<T, Search, Add, Update>
    extends IRepositoryCommand<Add, Update>,
        IRepositoryQuery<T, Search> {}
