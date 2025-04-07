export interface ICommandHandler<TCommand, TResult = void> {
    execute(command: TCommand): Promise<TResult>;
}

export interface IQueryHandler<TQuery, TResult> {
    execute(query: TQuery): Promise<TResult>;
}
