import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  findAllAdmin(@Query('fecha') fecha?: string) {
    return this.service.findAll(fecha);
  }
  
  @Get('admin/mes')
@UseGuards(JwtAuthGuard)
findAllMes(
  @Query('year') year: string,
  @Query('month') month: string,
) {
  return this.service.findAllMes(Number(year), Number(month));
}

  @Patch(':id/estado')
@UseGuards(JwtAuthGuard)
updateEstado(
  @Param('id') id: string,
  @Body() dto: UpdateEstadoDto,
) {
  return this.service.updateEstado(id, dto);
}
}