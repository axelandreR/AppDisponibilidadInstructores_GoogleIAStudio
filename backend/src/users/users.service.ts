import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca un usuario por su ID de negocio (ej. INST-001)
   */
  async findOne(id: string): Promise<User | null> {
    return (this.prisma as any).user.findUnique({
      where: { id },
    });
  }

  /**
   * Busca un usuario por su Email
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return (this.prisma as any).user.findUnique({
      where: { email },
    });
  }

  /**
   * Crea un nuevo usuario (Útil para scripts de seed o creación administrativa)
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return (this.prisma as any).user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return (this.prisma as any).user.update({
      where: { id },
      data,
    });
  }
}