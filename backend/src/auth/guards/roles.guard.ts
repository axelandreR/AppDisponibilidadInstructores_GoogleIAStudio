import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener roles requeridos desde el decorador @Roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles definidos, el endpoint es público (o solo requiere auth básica)
    if (!requiredRoles) {
      return true;
    }

    // 2. Obtener el usuario del request (inyectado previamente por JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user) return false;

    // 3. Regla de Supremacía: SUPER_ADMIN siempre tiene acceso a todo lo protegido por Roles
    if (user.role === Role.SUPER_ADMIN) {
        return true;
    }

    // 4. Verificar si el rol del usuario está en la lista permitida
    return requiredRoles.includes(user.role);
  }
}