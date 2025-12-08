import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JwtStrategy: Intercepta las peticiones con Header "Authorization: Bearer <token>"
 * Valida la firma del token y extrae el payload.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKeyDev', // Fallback solo para dev
    });
  }

  /**
   * Si el token es válido, este método se ejecuta.
   * Lo que retornemos aquí se inyectará en `request.user`.
   */
  async validate(payload: any) {
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Token payload inválido');
    }
    return { userId: payload.sub, role: payload.role, name: payload.name };
  }
}