export interface ITransformer<T, R> {
    transform(data: T): R;
}
