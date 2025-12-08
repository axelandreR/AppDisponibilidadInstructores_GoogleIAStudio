import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { Role } from '../auth/enums/role.enum';
import { Permission } from '../auth/enums/permission.enum';
import { User } from '../common/decorators/user.decorator';
import { Prisma } from '@prisma/client';

/**
 * Aplicamos los Guards a nivel de Controlador para asegurar que
 * todos los endpoints requieran al menos:
 * 1. Estar autenticado (JWT válido)
 * 2. Pasar validaciones de Roles/Permisos si se definen en los métodos
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * CASO 1: Endpoint protegido para SUPER ADMINISTRADORES.
   * Gestión de otros administradores.
   */
  @Post('admin')
  @Roles(Role.SUPER_ADMIN)
  createAdmin(@Body() createUserDto: Prisma.UserCreateInput) {
    return this.usersService.create(createUserDto);
  }

  /**
   * CASO 2: Endpoint protegido para ADMINISTRADORES con Permiso Granular.
   * Listar instructores (Requiere permiso 'canManageInstructors').
   * Nota: El SUPER_ADMIN pasa automáticamente gracias a la lógica en los Guards.
   */
  @Get('instructors')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @RequirePermission(Permission.CAN_MANAGE_INSTRUCTORS)
  findAllInstructors() {
    // Aquí iría la lógica de filtrado por rol INSTRUCTOR
    return { message: 'Lista de instructores entregada' };
  }

  /**
   * CASO 3: Endpoint protegido por PROPIEDAD DEL RECURSO (Instructor).
   * Un instructor solo puede ver su propio perfil detallado.
   * Un Admin/SuperAdmin puede ver el de cualquiera.
   */
  @Get(':id')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string, @User() currentUser: any) {
    // Lógica de "Propiedad del Recurso"
    const isOwner = currentUser.userId === id;
    const isAdmin = currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tiene permiso para ver los datos de otro instructor.');
    }

    const user = await this.usersService.findOne(id);
    if (user) {
        // Sanitizar salida (nunca devolver password)
        const { passwordHash, ...result } = user;
        return result;
    }
    return null;
  }
}