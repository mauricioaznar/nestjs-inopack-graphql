export function convertToInt(originalName, newName = originalName) {
    return `convert(${originalName}, double) as ${newName}`;
}
