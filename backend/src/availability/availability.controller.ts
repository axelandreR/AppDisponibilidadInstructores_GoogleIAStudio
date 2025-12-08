import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { User } from '../common/decorators/user.decorator';

@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /**
   * Crear nueva versión.
   * Solo INSTRUCTOR (para sí mismo).
   */
  @Post()
  @Roles(Role.INSTRUCTOR)
  create(@User() user: any, @Body() createDto: CreateAvailabilityDto) {
    return this.availabilityService.create(user.userId, createDto);
  }

  /**
   * Obtener historial propio.
   * INSTRUCTOR accede a sus datos.
   */
  @Get('my-history')
  @Roles(Role.INSTRUCTOR)
  findMyHistory(@User() user: any, @Query('periodId') periodId: string) {
    if (!periodId) throw new BadRequestException('periodId es requerido');
    return this.availabilityService.findAllByInstructor(user.userId, periodId);
  }

  /**
   * Obtener historial de un usuario específico.
   * ADMIN / SUPER_ADMIN.
   */
  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findUserHistory(@Param('userId') userId: string, @Query('periodId') periodId: string) {
    if (!periodId) throw new BadRequestException('periodId es requerido');
    return this.availabilityService.findAllByInstructor(userId, periodId);
  }

  /**
   * Obtener versión efectiva (Final o Última).
   * ADMIN / SUPER_ADMIN para reportes.
   * INSTRUCTOR para ver su estado actual.
   */
  @Get('effective/:userId')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN)
  getEffective(@Param('userId') userId: string, @Query('periodId') periodId: string, @User() currentUser: any) {
    // Validación de seguridad horizontal: Instructor solo ve lo suyo
    if (currentUser.role === Role.INSTRUCTOR && currentUser.userId !== userId) {
        throw new ForbiddenException('No puedes ver la disponibilidad de otro instructor');
    }
    if (!periodId) throw new BadRequestException('periodId es requerido');
    return this.availabilityService.getEffectiveVersion(userId, periodId);
  }

  /**
   * Obtener detalle de una versión específica.
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @User() currentUser: any) {
    const version = await this.availabilityService.findOne(id);
    
    // RBAC: Solo dueño o Admin
    const isOwner = version.instructorId === currentUser.userId;
    const isAdmin = currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
        throw new ForbiddenException('Acceso denegado a esta versión');
    }
    return version;
  }

  /**
   * Marcar versión como final.
   * Solo INSTRUCTOR (sobre sus propias versiones).
   */
  @Patch(':id/final')
  @Roles(Role.INSTRUCTOR)
  markAsFinal(@Param('id') id: string, @User() user: any) {
    // La validación de propiedad se hace dentro del servicio para asegurar atomicidad
    return this.availabilityService.markAsFinal(id, user.userId);
  }
}