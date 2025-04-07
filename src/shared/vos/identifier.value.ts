import { v7 } from 'uuid';

export class IdentifierValue {
    static v7(): string {
        return v7();
    }
}
