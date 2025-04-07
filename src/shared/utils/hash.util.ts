import { hash, compare } from 'bcryptjs';

export const hashByBcrypt = async (data: string, saltRounds = 10): Promise<string> => {
    return hash(data, saltRounds);
};

export const compareByBcrypt = async (data: string, hashedData: string): Promise<boolean> => {
    return compare(data, hashedData);
};
