import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { UpdateCantidadDto } from './dto/updateCantidad.dto';

@Injectable()
export class CantidadService {
  constructor(@Inject('MYSQL_POOL') private readonly db: Pool) {}

  // Obtener todas las cantidades de productos
  async findAll() {
    const [rows] = await this.db.query(
      `SELECT 
        id, 
        nombre, 
        tipo, 
        cantidad,
        CASE 
          WHEN cantidad = 0 THEN 'Agotado'
          WHEN cantidad <= 5 THEN 'Stock Bajo'
          WHEN cantidad <= 15 THEN 'Stock Medio'
          ELSE 'Stock Alto'
        END as estado_stock
      FROM productos 
      ORDER BY cantidad ASC`,
    );
    return rows;
  }

  // Obtener cantidad de un producto específico
  async findOne(id: number) {
    const [rows] = await this.db.query<any[]>(
      `SELECT 
        id, 
        nombre, 
        tipo, 
        cantidad,
        precio,
        CASE 
          WHEN cantidad = 0 THEN 'Agotado'
          WHEN cantidad <= 5 THEN 'Stock Bajo'
          WHEN cantidad <= 15 THEN 'Stock Medio'
          ELSE 'Stock Alto'
        END as estado_stock
      FROM productos 
      WHERE id = ?`,
      [id],
    );

    if (!rows.length) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return rows[0];
  }

  // Actualizar cantidad de un producto
  async update(id: number, updateCantidadDto: UpdateCantidadDto) {
    // Verificar que el producto existe
    await this.findOne(id);

    if (updateCantidadDto.cantidad !== undefined) {
      await this.db.execute('UPDATE productos SET cantidad = ? WHERE id = ?', [
        updateCantidadDto.cantidad,
        id,
      ]);
    }

    return this.findOne(id);
  }

  // Incrementar cantidad (útil para reposición)
  async incrementar(id: number, cantidad: number) {
    await this.findOne(id);

    await this.db.execute(
      'UPDATE productos SET cantidad = cantidad + ? WHERE id = ?',
      [cantidad, id],
    );

    return this.findOne(id);
  }

  // Decrementar cantidad (útil para ventas)
  async decrementar(id: number, cantidad: number) {
    const producto = await this.findOne(id);

    if (producto.cantidad < cantidad) {
      throw new Error(
        `Stock insuficiente. Disponible: ${producto.cantidad}, Solicitado: ${cantidad}`,
      );
    }

    await this.db.execute(
      'UPDATE productos SET cantidad = cantidad - ? WHERE id = ?',
      [cantidad, id],
    );

    return this.findOne(id);
  }

  // Obtener resumen de inventario
  async getResumen() {
    const [rows] = await this.db.query<any[]>(
      `SELECT 
        COUNT(*) as total_productos,
        SUM(cantidad) as total_unidades,
        SUM(CASE WHEN cantidad = 0 THEN 1 ELSE 0 END) as productos_agotados,
        SUM(CASE WHEN cantidad <= 5 AND cantidad > 0 THEN 1 ELSE 0 END) as productos_stock_bajo,
        SUM(CASE WHEN cantidad > 5 THEN 1 ELSE 0 END) as productos_stock_normal
      FROM productos`,
    );
    return rows[0];
  }

  // Productos que necesitan reposición
  async findNecesitanReposicion(minimo: number = 5) {
    const [rows] = await this.db.query(
      `SELECT 
        id, 
        nombre, 
        tipo, 
        cantidad,
        ? - cantidad as cantidad_a_reponer
      FROM productos 
      WHERE cantidad < ?
      ORDER BY cantidad ASC`,
      [minimo * 2, minimo],
    );
    return rows;
  }
}
