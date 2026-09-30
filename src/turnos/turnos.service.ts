import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateEstadoDto } from './dto/update-turnos.dto';

@Injectable()
export class TurnosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTurnoDto) {
    const servicio = await this.prisma.servicios.findFirst({
      where: {
        nombre: dto.servicio.trim(),
        activo: true,
      },
    });

    if (!servicio) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const fecha = new Date(`${dto.fecha}T00:00:00`);
    const hora = new Date(`1970-01-01T${dto.hora}:00`);

    const existe = await this.prisma.turnos.findFirst({
      where: {
        fecha,
        hora,
        estado: {
          not: 'CANCELADO',
        },
      },
    });

    if (existe) {
      throw new BadRequestException('Horario no disponible');
    }

    const telefono = dto.telefono.trim();

    let cliente = await this.prisma.clientes.findFirst({
      where: {
        telefono,
      },
    });

    if (!cliente) {
      cliente = await this.prisma.clientes.create({
        data: {
          nombre: dto.nombreCliente.trim(),
          telefono,
        },
      });
    } else if (cliente.nombre !== dto.nombreCliente.trim()) {
      cliente = await this.prisma.clientes.update({
        where: {
          id: cliente.id,
        },
        data: {
          nombre: dto.nombreCliente.trim(),
        },
      });
    }

    return this.prisma.turnos.create({
      data: {
        cliente_id: cliente.id,
        servicio_id: servicio.id,
        fecha,
        hora,
        estado: 'PENDIENTE',
      },
      include: {
        clientes: true,
        servicios: true,
      },
    });
  }

  async findAll(fecha?: string) {
    return this.prisma.turnos.findMany({
      where: fecha
        ? {
            fecha: new Date(`${fecha}T00:00:00`),
          }
        : undefined,
      include: {
        clientes: true,
        servicios: true,
      },
      orderBy: [
        {
          fecha: 'asc',
        },
        {
          hora: 'asc',
        },
      ],
    });
  }

  async findAllMes(year: number, month: number) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new BadRequestException(
      'Año o mes inválido',
    );
  }

  const inicio = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00`,
  );

  const siguienteMes =
    month === 12
      ? new Date(`${year + 1}-01-01T00:00:00`)
      : new Date(
          `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00`,
        );

  return this.prisma.turnos.findMany({
    where: {
      fecha: {
        gte: inicio,
        lt: siguienteMes,
      },
    },
    include: {
      clientes: true,
      servicios: true,
    },
    orderBy: [
      { fecha: "asc" },
      { hora: "asc" },
    ],
  });
}

  async updateEstado(id: string, dto: UpdateEstadoDto) {
    const turno = await this.prisma.turnos.findUnique({
      where: {
        id,
      },
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    return this.prisma.turnos.update({
      where: {
        id,
      },
      data: {
        estado: dto.estado,
      },
      include: {
        clientes: true,
        servicios: true,
      },
    });
  }
}