import { Controller, Get } from '@nestjs/common';

/**
 * HealthController: Endpoint simple para verificar que el API está viva.
 * Ruta: GET /api/v1/health
 */
@Controller('health')
export class HealthController {
  
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      message: 'Instructor Availability System API is running',
      timestamp: new Date().toISOString(),
    };
  }
}