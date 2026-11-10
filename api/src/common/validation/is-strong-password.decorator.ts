import { registerDecorator, ValidationOptions } from 'class-validator';
import { isStrongPassword, PASSWORD_RULES_MESSAGE } from './password.rules';

export function IsStrongPassword(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isStrongPassword',
      target: target.constructor,
      propertyName: propertyName as string,
      options: { message: PASSWORD_RULES_MESSAGE, ...options },
      validator: {
        validate: (value: unknown) => typeof value === 'string' && isStrongPassword(value),
      },
    });
  };
}
