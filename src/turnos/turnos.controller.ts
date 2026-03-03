import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateEstadoDto } from './dto/update-turnos.dto';
import { TurnosService } from './turnos.service';

@Controller('turnos')
export class TurnosController {
  constructor(private readonly service: TurnosService) {}

  @Post()
  create(@Body() dto: CreateTurnoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('fecha') fecha?: string) {
    return this.service.findAll(fecha);
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.service.updateEstado(id, dto);
  }
}