import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(@Inject('MYSQL_POOL') private readonly db: Pool) {}

  async create(dto: CreateProductoDto) {
    const [result] = await this.db.execute<any>(
      `INSERT INTO productos (nombre, tipo, precio, cantidad)
       VALUES (?, ?, ?, ?)`,
      [dto.nombre, dto.tipo, dto.precio, dto.cantidad],
    );

    return {
      id: result.insertId,
      ...dto,
    };
  }

  async findAll() {
    const [rows] = await this.db.query(
      'SELECT * FROM productos ORDER BY tipo, nombre',
    );
    return rows;
  }

  // Obtener productos agrupados por tipo
  async findByTipo(tipo: string) {
    const [rows] = await this.db.query(
      'SELECT * FROM productos WHERE tipo = ? ORDER BY nombre',
      [tipo],
    );
    return rows;
  }

  // Obtener productos disponibles (con stock)
  async findDisponibles() {
    const [rows] = await this.db.query(
      'SELECT * FROM productos WHERE cantidad > 0 ORDER BY tipo, nombre',
    );
    return rows;
  }

  async findOne(id: number) {
    const [rows] = await this.db.query<any[]>(
      'SELECT * FROM productos WHERE id = ?',
      [id],
    );

    if (!rows.length) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return rows[0];
  }

  // Obtener producto con sus opciones de pago
  async findOneWithMonedas(id: number) {
    const [rows] = await this.db.query<any[]>(
      `SELECT 
        p.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'moneda_id', m.id,
            'tipo', m.tipo,
            'cantidad_necesaria', pm.cantidad,
            'disponible', m.cantidad
          )
        ) as opciones_pago
      FROM productos p
      LEFT JOIN producto_monedas pm ON p.id = pm.producto_id
      LEFT JOIN monedas m ON pm.moneda_id = m.id
      WHERE p.id = ?
      GROUP BY p.id`,
      [id],
    );

    if (!rows.length) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return rows[0];
  }

  async update(id: number, dto: UpdateProductoDto) {
    // Verificar que existe
    await this.findOne(id);

    const updates: string[] = [];
    const values: any[] = [];

    if (dto.nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(dto.nombre);
    }
    if (dto.tipo !== undefined) {
      updates.push('tipo = ?');
      values.push(dto.tipo);
    }
    if (dto.precio !== undefined) {
      updates.push('precio = ?');
      values.push(dto.precio);
    }
    if (dto.cantidad !== undefined) {
      updates.push('cantidad = ?');
      values.push(dto.cantidad);
    }

    if (updates.length === 0) {
      return this.findOne(id);
    }

    values.push(id);

    await this.db.execute(
      `UPDATE productos SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );

    return this.findOne(id);
  }

  // Actualizar solo la cantidad (útil para compras)
  async updateCantidad(id: number, cantidad: number) {
    await this.db.execute(
      'UPDATE productos SET cantidad = cantidad + ? WHERE id = ?',
      [cantidad, id],
    );
    return this.findOne(id);
  }

  // Reducir stock (para compra)
  async reducirStock(id: number, cantidad: number = 1) {
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

  async remove(id: number) {
    await this.findOne(id);

    await this.db.execute('DELETE FROM productos WHERE id = ?', [id]);

    return { deleted: true, id };
  }

  // Estadísticas de productos
  async getEstadisticas() {
    const [rows] = await this.db.query<any[]>(
      `SELECT 
        tipo,
        COUNT(*) as total_productos,
        SUM(cantidad) as total_stock,
        MIN(precio) as precio_minimo,
        MAX(precio) as precio_maximo,
        AVG(precio) as precio_promedio
      FROM productos
      GROUP BY tipo`,
    );
    return rows;
  }

  // Productos con bajo stock
  async findBajoStock(minimo: number = 5) {
    const [rows] = await this.db.query(
      'SELECT * FROM productos WHERE cantidad <= ? ORDER BY cantidad ASC',
      [minimo],
    );
    return rows;
  }
}
