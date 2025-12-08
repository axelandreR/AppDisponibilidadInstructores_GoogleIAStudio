import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RecoveryDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID de usuario es obligatorio' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: 'El DNI es obligatorio para validar identidad' })
  dni: string;

  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  // En producción, descomentar para forzar complejidad:
  // @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'La contraseña es muy débil' })
  newPassword: string;
}