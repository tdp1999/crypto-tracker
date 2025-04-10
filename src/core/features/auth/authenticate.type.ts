export interface IJwtPayload {
    iss: string;
    sub: string;
    email: string;
}

export interface IJwtData extends IJwtPayload {
    iat: number;
    exp: number;
}
