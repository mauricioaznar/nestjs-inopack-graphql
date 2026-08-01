import { vennDiagram } from './venn-diagram';

describe('vennDiagram', () => {
    it('reports an unchanged row as an intersection when the id round-trips', () => {
        const { aMinusB, bMinusA, intersection } = vennDiagram({
            a: [{ id: 13493, amount: 100 }],
            b: [{ id: 13493, amount: 100 }],
            indexProperties: ['id'],
        });

        expect(aMinusB).toHaveLength(0);
        expect(bMinusA).toHaveLength(0);
        expect(intersection).toHaveLength(1);
    });

    it('treats a null id as a new row rather than a match', () => {
        const { aMinusB, bMinusA, intersection } = vennDiagram({
            a: [{ id: 13493 as number | null, amount: 100 }],
            b: [{ id: null as number | null, amount: 250 }],
            indexProperties: ['id'],
        });

        expect(aMinusB).toHaveLength(1);
        expect(bMinusA).toHaveLength(1);
        expect(intersection).toHaveLength(0);
    });

    it('keeps several new rows distinct instead of collapsing them', () => {
        const { bMinusA } = vennDiagram({
            a: [] as { id: number | null }[],
            b: [{ id: null }, { id: null }],
            indexProperties: ['id'],
        });

        expect(bMinusA).toHaveLength(2);
    });

    it('matches on a business key when that is what the caller indexes on', () => {
        const { aMinusB, bMinusA, intersection } = vennDiagram({
            a: [{ employee_id: 7, is_leader: 0 }],
            b: [{ employee_id: 7, is_leader: 1 }],
            indexProperties: ['employee_id'],
        });

        expect(aMinusB).toHaveLength(0);
        expect(bMinusA).toHaveLength(0);
        expect(intersection).toHaveLength(1);
    });

    // The guard. Without it, a payload that omits its index property is read as
    // "nothing matches", so every persisted row is deleted and every submitted
    // row re-created — which is exactly what order productions and transfers
    // were doing on every save.
    it('throws when the payload omits its index property', () => {
        expect(() =>
            vennDiagram({
                a: [{ id: 138068 as number | undefined, kilos: 10 }],
                b: [{ id: undefined as number | undefined, kilos: 10 }],
                indexProperties: ['id'],
            }),
        ).toThrow(/index property 'id' is undefined on b\[0\]/);
    });

    it('throws when a persisted row is missing its index property', () => {
        expect(() =>
            vennDiagram({
                a: [{ id: undefined as number | undefined, units: 3 }],
                b: [{ id: 41 as number | undefined, units: 3 }],
                indexProperties: ['id'],
            }),
        ).toThrow(/index property 'id' is undefined on a\[0\]/);
    });

    it('names the offending index property when several are used', () => {
        expect(() =>
            vennDiagram({
                a: [{ machine_id: 3, spare_id: 9 }],
                b: [{ machine_id: 3, spare_id: undefined as number | undefined }],
                indexProperties: ['machine_id', 'spare_id'],
            }),
        ).toThrow(/index property 'spare_id' is undefined on b\[0\]/);
    });
});
