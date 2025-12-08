import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService: Extiende el cliente de Prisma para integrarse con el ciclo de vida de NestJS.
 * Se encarga de abrir y cerrar conexiones a PostgreSQL.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Conectar a la base de datos al iniciar el módulo
    await (this as any).$connect();
  }

  async onModuleDestroy() {
    // Desconectar al apagar la aplicación
    await (this as any).$disconnect();
  }
}