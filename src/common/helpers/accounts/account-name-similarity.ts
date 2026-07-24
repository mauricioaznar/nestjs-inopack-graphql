export const ACCOUNT_NAME_FUZZY_THRESHOLD = 0.82;
export const ACCOUNT_NAME_FUZZY_MIN_LENGTH = 5;

export function normalizeAccountName(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es-MX')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

export function accountNameSimilarity(left: string, right: string): number {
    if (left === right) return 1;
    if (!left || !right) return 0;

    const distances = Array.from({ length: right.length + 1 }, (_, index) => index);

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
        let diagonal = distances[0];
        distances[0] = leftIndex;

        for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
            const previous = distances[rightIndex];
            distances[rightIndex] = Math.min(
                distances[rightIndex] + 1,
                distances[rightIndex - 1] + 1,
                diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
            );
            diagonal = previous;
        }
    }

    return 1 - distances[right.length] / Math.max(left.length, right.length);
}
