import { registerDecorator, ValidationOptions } from 'class-validator';
import dayjs from 'dayjs';

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
                        return dayjs(value, 'YYYY-MM', true).isValid();
                    }
                    return false;
                },
            },
        });
    };
}
