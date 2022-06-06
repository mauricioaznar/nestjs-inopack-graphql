import {
    Machine,
    MachinePart,
    MachineSection,
} from '../../../common/dto/entities';

export interface MachinesSeed {
    cmd: {
        machine: Machine | null;
        sections: {
            seccion1: {
                section: MachineSection;
                parts: {
                    parte1: MachinePart;
                    parte2: MachinePart;
                    parte3: MachinePart;
                };
            };
            seccion2: {
                section: MachineSection;
                parts: {
                    parte4: MachinePart;
                    parte5: MachinePart;
                };
            };
            seccion3: {
                section: MachineSection;
                parts: {
                    parte6: MachinePart;
                    parte7: MachinePart;
                    parte8: MachinePart;
                    parte9: MachinePart;
                };
            };
            seccion4: {
                section: MachineSection;
                parts: {
                    parte10: MachinePart;
                };
            };
        };
        unassigned_parts: {
            parte11: MachinePart;
            parte12: MachinePart;
        };
    };
    camisetera1: Machine | null;
    camisetera2: Machine | null;
    camisetera3: Machine | null;
    selloLateral1: Machine | null;
    extrusoraMinigrip: Machine | null;
    extrusora2: Machine | null;
    extrusora3: Machine | null;
    extrusora4: Machine | null;
    extrusora5: Machine | null;
    extrusora6: Machine | null;
    extrusora7: Machine | null;
    dobladora3: Machine | null;
    selloDeFondo2: Machine | null;
    coemter: Machine | null;
    shelda: Machine | null;
    dobladora4: Machine | null;
    compactadora: Machine | null;
}
