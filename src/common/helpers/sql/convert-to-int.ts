export function convertToInt(originalName, newName = originalName) {
    return `cast(${originalName} as float(12)) as ${newName}`;
}
