export const AUTH_TOKEN = {
    JWT_SERVICE: Symbol('AUTH.JWT_SERVICE'),
    USER_REPOSITORY: Symbol('AUTH.USER_REPOSITORY'),
    HANDLERS: {
        QUERY: {
            ME: Symbol('AUTH.QUERY.ME'),
        },
        COMMAND: {
            REGISTER: Symbol('AUTH.COMMAND.REGISTER'),
            LOGIN: Symbol('AUTH.COMMAND.LOGIN'),
            LOGOUT: Symbol('AUTH.COMMAND.LOGOUT'),
        },
    },
};
