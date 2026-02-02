import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // Crear producto (Admin)
  @Post()
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  // Obtener todos los productos
  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  // Obtener solo productos disponibles (con stock > 0)
  @Get('disponibles')
  findDisponibles() {
    return this.productosService.findDisponibles();
  }

  // Obtener productos por tipo (Bebida, Snack, etc.)
  @Get('tipo/:tipo')
  findByTipo(@Param('tipo') tipo: string) {
    return this.productosService.findByTipo(tipo);
  }

  // Obtener estadísticas
  @Get('stats/general')
  getEstadisticas() {
    return this.productosService.getEstadisticas();
  }

  // Productos con bajo stock
  @Get('stats/bajo-stock')
  findBajoStock(@Query('minimo') minimo?: string) {
    const min = minimo ? parseInt(minimo) : 5;
    return this.productosService.findBajoStock(min);
  }

  // Obtener un producto específico con opciones de pago
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOneWithMonedas(id);
  }

  // Actualizar producto (Admin)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, updateProductoDto);
  }

  // Eliminar producto (Admin)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}
