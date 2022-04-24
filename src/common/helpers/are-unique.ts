interface IAreUnique<T> {
    items: T[];
    indexProperty: keyof T;
}

export function areUnique<T>(options: IAreUnique<T>): boolean {
    const { items, indexProperty } = options;
    return items.some(function hasOne(someItem) {
        const count = items.filter(
            (filterItem) =>
                someItem[indexProperty] === filterItem[indexProperty],
        ).length;
        return count === 1;
    });
}
