interface IVennDiagram<T> {
    a: T[];
    b: T[];
    indexProperties: (keyof T)[];
}

interface IVennDiagramResult<T> {
    aMinusB: T[];
    bMinusA: T[];
    intersection: T[];
}

export function vennDiagram<T>(
    options: IVennDiagram<T>,
): IVennDiagramResult<T> {
    const { a, b, indexProperties } = options;

    const intersections = [];

    const aMinusB = a.filter((aItem) => {
        const foundBItem = b.find((bItem) =>
            indexProperties.every(
                (indexProperty) =>
                    aItem[indexProperty] === bItem[indexProperty],
            ),
        );

        if (foundBItem) {
            intersections.push(foundBItem);
        }
        return !foundBItem;
    });

    const bMinusA = b.filter((bItem) => {
        const foundAItem = a.find((aItem) =>
            indexProperties.every(
                (indexProperty) =>
                    aItem[indexProperty] === bItem[indexProperty],
            ),
        );
        return !foundAItem;
    });

    return {
        aMinusB: aMinusB,
        bMinusA: bMinusA,
        intersection: intersections,
    };
}
