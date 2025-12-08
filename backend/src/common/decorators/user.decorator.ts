import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @User()
 * Permite acceder a los datos del usuario extraídos del token en el controlador.
 * Ejemplo: getProfile(@User() user: any)
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);