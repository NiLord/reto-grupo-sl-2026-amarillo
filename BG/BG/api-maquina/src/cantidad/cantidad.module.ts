import { Module } from '@nestjs/common';
import { CantidadService } from './cantidad.service';
import { CantidadController } from './cantidad.controller';
import { DatabaseModule } from 'src/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CantidadController],
  providers: [CantidadService],
})
export class CantidadModule {}
