import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService], // Exportamos el servicio para usarlo en AuthModule
})
export class UsersModule {}