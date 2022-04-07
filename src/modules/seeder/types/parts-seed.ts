import { Part } from '../../../common/dto/entities/part.dto';

export interface PartsSeed {
  materials: {
    contactor400: Part;
    contactor500: Part;
    tornillo1: Part;
    banda600: Part;
    banda700: Part;
    banda800: Part;
    resistencia20: Part;
    resistencia30: Part;
    resistencia40: Part;
  };
}
