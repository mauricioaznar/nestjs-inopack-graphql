import { Spare } from '../../../common/dto/entities';

export interface SparesSeed {
    materials: {
        contactor400: Spare;
        contactor500: Spare;
        contactor700: Spare;
        contactor900: Spare;
        tornillo1: Spare;
        tornillo2: Spare;
        tornillo3: Spare;
        banda600: Spare;
        banda700: Spare;
        banda800: Spare;
        resistencia20: Spare;
        resistencia30: Spare;
        resistencia40: Spare;
        gomas1: Spare;
        gomas2: Spare;
        balero1: Spare;
        piston1: Spare;
        piston2: Spare;
    };
}
