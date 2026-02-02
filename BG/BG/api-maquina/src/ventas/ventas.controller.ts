import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CompraDto, VerificarCompraDto } from './dto/ventas-dto';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  // Verificar si se puede realizar la compra y calcular cambio
  @Post('verificar')
  async verificarCompra(@Body() dto: VerificarCompraDto) {
    return this.ventasService.verificarCompra(dto);
  }

  // Realizar la compra completa
  @Post('comprar')
  async comprar(@Body() dto: CompraDto) {
    return this.ventasService.realizarCompra(dto);
  }

  // Verificar disponibilidad de cambio para un monto
  @Get('verificar-cambio/:producto_id/:monto')
  async verificarCambio(
    @Param('producto_id', ParseIntPipe) productoId: number,
    @Param('monto') monto: string,
  ) {
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum)) {
      throw new BadRequestException('Monto inválido');
    }
    return this.ventasService.verificarCambioDisponible(productoId, montoNum);
  }

  // Cancelar transacción y devolver monedas
  @Post('cancelar')
  async cancelarTransaccion(
    @Body()
    body: {
      monedas_insertadas: Array<{ tipo: string; cantidad: number }>;
    },
  ) {
    return this.ventasService.devolverMonedas(body.monedas_insertadas);
  }
}
