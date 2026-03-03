import { IsIn } from 'class-validator';

export class UpdateEstadoDto {
  @IsIn(['PENDIENTE', 'CONFIRMADO', 'CANCELADO'])
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO';
}