import { Part } from '../../../common/dto/entities/part.dto';

export interface PartsSeed {
    materials: {
        contactor400: Part;
        contactor500: Part;
        contactor700: Part;
        contactor900: Part;
        tornillo1: Part;
        tornillo2: Part;
        tornillo3: Part;
        banda600: Part;
        banda700: Part;
        banda800: Part;
        resistencia20: Part;
        resistencia30: Part;
        resistencia40: Part;
        gomas1: Part;
        gomas2: Part;
        balero1: Part;
        piston1: Part;
        piston2: Part;
    };
}
