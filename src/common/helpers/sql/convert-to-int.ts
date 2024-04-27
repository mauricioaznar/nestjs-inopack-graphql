export function convertToInt(originalName, newName = originalName) {
    return `cast(${originalName} as decimal(12, 2)) as ${newName}`;
}
