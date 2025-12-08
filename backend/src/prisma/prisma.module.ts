import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @Global() hace que PrismaService esté disponible en toda la aplicación
 * sin necesidad de importarlo en cada módulo individualmente.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}