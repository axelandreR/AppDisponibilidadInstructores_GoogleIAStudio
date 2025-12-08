import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AvailabilityModule } from './availability/availability.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    // Variables de Entorno Globales
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Módulos de Infraestructura
    PrismaModule,
    
    // Módulos de Funcionalidad
    HealthModule,
    AuthModule,
    UsersModule,
    AvailabilityModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}