import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateEstadoDto } from './dto/update-turnos.dto';

type TurnoEstado = 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO';

type Turno = {
  id: string;
  nombreCliente: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: TurnoEstado;
  createdAt: string;
};

@Injectable()
export class TurnosService {
  private turnos: Turno[] = [];

  create(dto: CreateTurnoDto): Turno {
    const existe = this.turnos.find(
      t => t.fecha === dto.fecha && t.hora === dto.hora && t.estado !== 'CANCELADO',
    );
    if (existe) throw new BadRequestException('Horario no disponible');

    const nuevo: Turno = {
      id: randomUUID(),
      nombreCliente: dto.nombreCliente.trim(),
      telefono: dto.telefono.trim(),
      servicio: dto.servicio.trim(),
      fecha: dto.fecha,
      hora: dto.hora,
      estado: 'PENDIENTE',
      createdAt: new Date().toISOString(),
    };

    this.turnos.push(nuevo);
    return nuevo;
  }

  findAll(fecha?: string): Turno[] {
    const data = fecha ? this.turnos.filter(t => t.fecha === fecha) : this.turnos;
    return [...data].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }

  updateEstado(id: string, dto: UpdateEstadoDto): Turno {
    const idx = this.turnos.findIndex(t => t.id === id);
    if (idx === -1) throw new NotFoundException('Turno no encontrado');

    this.turnos[idx] = { ...this.turnos[idx], estado: dto.estado };
    return this.turnos[idx];
  }
}