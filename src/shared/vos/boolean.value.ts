export abstract class BooleanValue {
    static toBoolean(value: any) {
        if (!value || typeof value !== 'string') {
            throw new Error('Invalid boolean value');
        }

        const lowerCaseValue = value.toLowerCase();

        if (lowerCaseValue === 'true') {
            return true;
        }

        if (lowerCaseValue === 'false') {
            return false;
        }

        throw new Error('Invalid boolean value');
    }
}
