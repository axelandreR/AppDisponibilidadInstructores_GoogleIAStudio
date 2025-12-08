import { IsArray, IsNotEmpty, IsString, IsOptional, ArrayMinSize } from 'class-validator';

export class CreateAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  periodId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un bloque de horario' })
  @IsString({ each: true })
  slots: string[]; // Formato esperado: ["Lunes-07:30", "Martes-09:00"]

  @IsOptional()
  @IsString()
  comments?: string;
}