import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { MonedasService } from './monedas.service';
import { CreateMonedaDto } from './dto/create-moneda.dto';
import { UpdateMonedaDto } from './dto/update-moneda.dto';

@Controller('monedas')
export class MonedasController {
  constructor(private readonly monedasService: MonedasService) {}

  // Crear nueva denominación (Admin)
  @Post()
  create(@Body() createMonedaDto: CreateMonedaDto) {
    return this.monedasService.create(createMonedaDto);
  }

  // Obtener todas las monedas
  @Get()
  findAll() {
    return this.monedasService.findAll();
  }

  // Obtener monedas disponibles (cantidad > 0)
  @Get('disponibles')
  getMonedasDisponibles() {
    return this.monedasService.getMonedasDisponibles();
  }

  // Obtener valor total en la máquina
  @Get('stats/valor-total')
  getValorTotal() {
    return this.monedasService.getValorTotal();
  }

  // Monedas con bajo stock
  @Get('stats/bajo-stock')
  findBajoStock(@Query('minimo') minimo?: string) {
    const min = minimo ? parseInt(minimo) : 10;
    return this.monedasService.findBajoStock(min);
  }

  // Obtener una moneda específica
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.monedasService.findOne(id);
  }

  // Buscar por tipo (ejemplo: "1.00")
  @Get('tipo/:tipo')
  findByTipo(@Param('tipo') tipo: string) {
    return this.monedasService.findByTipo(tipo);
  }

  // Actualizar moneda (Admin)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMonedaDto: UpdateMonedaDto,
  ) {
    return this.monedasService.update(id, updateMonedaDto);
  }

  // Actualizar cantidad específica
  @Patch(':id/cantidad')
  updateCantidad(
    @Param('id', ParseIntPipe) id: number,
    @Body('cantidad', ParseIntPipe) cantidad: number,
  ) {
    return this.monedasService.updateCantidad(id, cantidad);
  }

  // Eliminar moneda (Admin)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.monedasService.remove(id);
  }
}
