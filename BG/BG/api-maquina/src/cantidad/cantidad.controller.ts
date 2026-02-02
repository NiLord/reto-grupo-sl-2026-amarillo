import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CantidadService } from './cantidad.service';
import { UpdateCantidadDto } from './dto/updateCantidad.dto';

@Controller('cantidad')
export class CantidadController {
  constructor(private readonly cantidadService: CantidadService) {}

  @Get()
  findAll() {
    return this.cantidadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cantidadService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCantidadDto: UpdateCantidadDto,
  ) {
    return this.cantidadService.update(+id, updateCantidadDto);
  }
}
