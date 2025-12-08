import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { UsersModule } from '../users/users.module';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [UsersModule, AvailabilityModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}