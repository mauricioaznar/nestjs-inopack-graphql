interface IVennDiagram<T> {
  a: T[];
  b: T[];
  indexProperty: keyof T;
}

interface IVennDiagramResult<T> {
  aMinusB: T[];
  bMinusA: T[];
  intersection: T[];
}

export function vennDiagram<T>(
  options: IVennDiagram<T>,
): IVennDiagramResult<T> {
  const { a, b, indexProperty } = options;

  const intersections = [];

  const aMinusB = a.filter((aItem) => {
    const foundBItem = b.find(
      (bItem) => bItem[indexProperty] === aItem[indexProperty],
    );

    if (foundBItem) {
      intersections.push(foundBItem);
    }
    return !foundBItem;
  });

  const bMinusA = b.filter((bItem) => {
    const foundAItem = a.find(
      (aItem) => bItem[indexProperty] === aItem[indexProperty],
    );
    return !foundAItem;
  });

  return {
    aMinusB: aMinusB,
    bMinusA: bMinusA,
    intersection: intersections,
  };
}
