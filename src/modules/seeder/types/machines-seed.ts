import {
    Machine,
    MachineComponent,
    MachineSection,
} from '../../../common/dto/entities';

export interface MachinesSeed {
    cmd: {
        machine: Machine;
        sections: {
            seccion1: {
                section: MachineSection;
                components: {
                    componente1: MachineComponent;
                    componente2: MachineComponent;
                    componente3: MachineComponent;
                };
            };
            seccion2: {
                section: MachineSection;
                components: {
                    componente4: MachineComponent;
                    componente5: MachineComponent;
                };
            };
            seccion3: {
                section: MachineSection;
                components: {
                    componente6: MachineComponent;
                    componente7: MachineComponent;
                    componente8: MachineComponent;
                    componente9: MachineComponent;
                };
            };
            seccion4: {
                section: MachineSection;
                components: {
                    componente10: MachineComponent;
                };
            };
        };
        unassigned_components: {
            componente11: MachineComponent;
            componente12: MachineComponent;
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
