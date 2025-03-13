export class ObjectValue {
    /**
     * Checks if the given object is empty.
     * @param obj The object to check.
     * @returns True if the object is empty, false otherwise.
     */
    static isEmpty(obj: Record<string, any>): boolean {
        return obj && Object.keys(obj).length === 0;
    }
}
