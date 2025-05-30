// Asset Module Dependency Injection Tokens

export const ASSET_TOKENS = {
    REPOSITORIES: {
        TOKEN: Symbol('ASSET.REPOSITORY.TOKEN'),
        TOKEN_PRICE: Symbol('ASSET.REPOSITORY.TOKEN_PRICE'),
    },

    HANDLERS: {
        QUERY: {
            GET_TOKEN: Symbol('ASSET.QUERY.GET_TOKEN'),
            SEARCH_TOKENS: Symbol('ASSET.QUERY.SEARCH_TOKENS'),
            GET_TOKEN_PRICE: Symbol('ASSET.QUERY.GET_TOKEN_PRICE'),
        },
        COMMAND: {
            CREATE_TOKEN: Symbol('ASSET.COMMAND.CREATE_TOKEN'),
            UPDATE_TOKEN: Symbol('ASSET.COMMAND.UPDATE_TOKEN'),
            UPDATE_TOKEN_PRICE: Symbol('ASSET.COMMAND.UPDATE_TOKEN_PRICE'),
        },
    },
};
