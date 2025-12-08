import { Controller, Get, Param, Query, Res, UseGuards, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { User } from '../common/decorators/user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Descargar Reporte Consolidado (Todos los instructores)
   * Solo ADMIN y SUPER_ADMIN
   */
  @Get('consolidated')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async downloadConsolidated(
    @Query('periodId') periodId: string,
    @Res() res: Response
  ) {
    if (!periodId) throw new BadRequestException('periodId es requerido');

    const csvData = await this.reportsService.generateConsolidatedReport(periodId);
    
    // Configurar Headers para descarga de archivo
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="consolidado_${periodId}.csv"`,
    });

    res.send(csvData);
  }

  /**
   * Descargar Reporte Individual
   * INSTRUCTOR (solo propio), ADMIN, SUPER_ADMIN
   */
  @Get('instructor/:instructorId')
  @Roles(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN)
  async downloadIndividual(
    @Param('instructorId') instructorId: string,
    @Query('periodId') periodId: string,
    @User() currentUser: any,
    @Res() res: Response
  ) {
    // Validación Horizontal: Un instructor no puede bajar el reporte de otro
    if (currentUser.role === Role.INSTRUCTOR && currentUser.userId !== instructorId) {
        throw new ForbiddenException('No tienes permiso para descargar este reporte');
    }
    
    if (!periodId) throw new BadRequestException('periodId es requerido');

    const csvData = await this.reportsService.generateIndividualReport(instructorId, periodId);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="reporte_${instructorId}_${periodId}.csv"`,
    });

    res.send(csvData);
  }
}