export interface ITransformer<T, R, Q> {
    transformQuery(query: Q): Record<string, any>;
    transform(data: T): R;
}
