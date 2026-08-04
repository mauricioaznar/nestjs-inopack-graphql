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

// An `undefined` index property is always a programming error, never data.
//
// Callers match persisted rows (`a`) against a client payload (`b`) on a key.
// On the `a` side `undefined` means a column was not selected; on the `b` side
// it means a mapping forgot to forward the key. Both used to be read as "this
// row matches nothing", so every existing row was deleted and every submitted
// row re-created — silently, on every save. Failing loudly here turns that into
// a first-save error instead of years of churn.
//
// `null` stays legal on purpose. It is how the forms signal "new row"
// (`id: row.id || null`), and some business keys are nullable columns
// (`machine_compatibilities.spare_id`). Note that two `null`s still compare
// equal, so a nullable key on the `a` side can match a new row on the `b` side —
// harmless where `a` is keyed on a primary key, which is every caller today.
function assertIndexed<T>(
    items: T[],
    indexProperties: (keyof T)[],
    side: 'a' | 'b',
): void {
    items.forEach((item, i) => {
        indexProperties.forEach((indexProperty) => {
            if (item[indexProperty] === undefined) {
                throw new Error(
                    `vennDiagram: index property '${String(
                        indexProperty,
                    )}' is undefined on ${side}[${i}]. ` +
                        `Every item must carry its index property (null is allowed for new rows).`,
                );
            }
        });
    });
}

export function vennDiagram<T>(
    options: IVennDiagram<T>,
): IVennDiagramResult<T> {
    const { a, b, indexProperties } = options;

    assertIndexed(a, indexProperties, 'a');
    assertIndexed(b, indexProperties, 'b');

    const intersections: T[] = [];

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
