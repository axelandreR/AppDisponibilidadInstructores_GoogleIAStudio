import { Controller, Request, Post, UseGuards, Get, Body, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RecoveryDto } from './dto/recovery.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Inicio de sesión público
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/v1/auth/recovery
   * Recuperación de contraseña pública (ID + DNI)
   */
  @Post('recovery')
  async recover(@Body() recoveryDto: RecoveryDto) {
    return this.authService.recoverPassword(recoveryDto);
  }

  /**
   * GET /api/v1/auth/me
   * Obtener perfil del usuario actual. Protegido por JWT.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@User() user: any) {
    // request.user viene del JwtStrategy.validate()
    return user;
  }

  /**
   * PATCH /api/v1/auth/password
   * Cambio de contraseña autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async changePassword(@User() user: any, @Body() changeDto: ChangePasswordDto) {
      return this.authService.changePassword(user.userId, changeDto);
  }
}