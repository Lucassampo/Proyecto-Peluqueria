import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TurnosModule } from './turnos/turnos.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    TurnosModule,
    AuthModule,
  ],
})
export class AppModule {}