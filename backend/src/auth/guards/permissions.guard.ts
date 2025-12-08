import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener permisos requeridos
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // 2. Regla de Supremacía: SUPER_ADMIN ignora validación granular
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // 3. Si es Instructor, generalmente no tiene permisos de admin (rechazar)
    // A menos que expandamos la lógica para instructores con permisos especiales en el futuro.
    if (user.role === Role.INSTRUCTOR) {
        return false;
    }

    // 4. Validar permisos granulares del ADMIN
    // user.permissions viene del JWT payload como un objeto: { canManageConfig: true, ... }
    const userPermissions = user.permissions || {};

    const hasAllPermissions = requiredPermissions.every((permission) => 
      userPermissions[permission] === true
    );

    if (!hasAllPermissions) {
        throw new ForbiddenException('No tiene los permisos granulares necesarios para esta acción.');
    }

    return true;
  }
}