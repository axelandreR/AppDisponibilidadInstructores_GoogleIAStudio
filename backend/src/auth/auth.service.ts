import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RecoveryDto } from './dto/recovery.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida credenciales contra la base de datos.
   */
  async validateUser(id: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(id);
    
    // 1. Validar existencia
    if (!user) return null;

    // 2. Validar estado activo
    if (!user.isActive) {
       throw new ForbiddenException('Usuario inactivo. Contacte al administrador.');
    }

    // 3. Validar contraseña (Hash)
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (user && isMatch) {
      // Excluir password del objeto retornado
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Genera el JWT tras un login exitoso.
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.id, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { 
        sub: user.id, 
        role: user.role, 
        name: user.name,
        permissions: user.permissions 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: user, // Retornamos datos básicos para el frontend
    };
  }

  /**
   * Recuperación de contraseña: ID + DNI
   */
  async recoverPassword(recoveryDto: RecoveryDto) {
      const user = await this.usersService.findOne(recoveryDto.id);

      if (!user) {
          // Por seguridad, retornamos mensaje genérico o NotFound
          throw new NotFoundException('Usuario no encontrado o datos incorrectos');
      }

      // Validar DNI (Regla funcional)
      if (user.dni !== recoveryDto.dni) {
          throw new BadRequestException('Los datos de identidad no coinciden');
      }

      // Actualizar Password
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(recoveryDto.newPassword, salt);

      await this.usersService.update(user.id, {
          passwordHash: hash
      });

      return { message: 'Contraseña actualizada correctamente. Inicie sesión.' };
  }

  /**
   * Cambio de contraseña desde sesión activa
   */
  async changePassword(userId: string, changeDto: ChangePasswordDto) {
      const user = await this.usersService.findOne(userId);
      if (!user) throw new NotFoundException('Usuario no encontrado');

      // Validar password actual
      const isMatch = await bcrypt.compare(changeDto.currentPassword, user.passwordHash);
      if (!isMatch) {
          throw new BadRequestException('La contraseña actual es incorrecta');
      }

      // Actualizar
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(changeDto.newPassword, salt);

      await this.usersService.update(userId, {
          passwordHash: hash
      });

      return { message: 'Contraseña cambiada exitosamente' };
  }
}