import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateTurnoDto {
  @IsString()
  @IsNotEmpty()
  nombreCliente: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  servicio: string;

  // YYYY-MM-DD
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha: string;

  // HH:mm
  @Matches(/^\d{2}:\d{2}$/)
  hora: string;
}