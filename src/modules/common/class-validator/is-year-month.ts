import { registerDecorator, ValidationOptions } from 'class-validator';
import moment from 'moment';

export function IsYearMonth(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsYearMonth',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value === 'string') {
            return moment(value, 'YYYY-MM', true).isValid();
          }
          return false;
        },
      },
    });
  };
}
