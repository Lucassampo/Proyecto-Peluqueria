import { Module } from '@nestjs/common';
import { TurnosModule } from './turnos/turnos.module';

@Module({
  imports: [TurnosModule],
})
export class AppModule {}
