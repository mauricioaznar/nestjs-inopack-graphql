import {
    Machine,
    MachinePart,
    MachineSection,
} from '../../../common/dto/entities';

export interface MachinesSeed {
    cmd: {
        machine: Machine;
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
    camisetera1: Machine;
    camisetera2: Machine;
    camisetera3: Machine;
    selloLateral1: Machine;
    extrusoraMinigrip: Machine;
    extrusora2: Machine;
    extrusora3: Machine;
    extrusora4: Machine;
    extrusora5: Machine;
    extrusora6: Machine;
    extrusora7: Machine;
    dobladora3: Machine;
    selloDeFondo2: Machine;
    coemter: Machine;
    shelda: Machine;
    dobladora4: Machine;
    compactadora: Machine;
}
