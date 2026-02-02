import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { CreateMonedaDto } from './dto/create-moneda.dto';
import { UpdateMonedaDto } from './dto/update-moneda.dto';

@Injectable()
export class MonedasService {
  constructor(@Inject('MYSQL_POOL') private readonly db: Pool) {}

  async create(dto: CreateMonedaDto) {
    const [result] = await this.db.execute<any>(
      `INSERT INTO monedas (tipo, cantidad)
       VALUES (?, ?)`,
      [dto.tipo, dto.cantidad],
    );

    return {
      id: result.insertId,
      ...dto,
    };
  }

  async findAll() {
    const [rows] = await this.db.query(
      'SELECT * FROM monedas ORDER BY CAST(tipo AS DECIMAL(10,2)) DESC',
    );
    return rows;
  }

  async findOne(id: number) {
    const [rows] = await this.db.query<any[]>(
      'SELECT * FROM monedas WHERE id = ?',
      [id],
    );

    if (!rows.length) {
      throw new NotFoundException(`Moneda con id ${id} no encontrada`);
    }

    return rows[0];
  }

  // Buscar moneda por tipo (ejemplo: "1.00")
  async findByTipo(tipo: string) {
    const [rows] = await this.db.query<any[]>(
      'SELECT * FROM monedas WHERE tipo = ?',
      [tipo],
    );
    return rows[0] ?? null;
  }

  async update(id: number, dto: UpdateMonedaDto) {
    // Verificar que existe
    await this.findOne(id);

    const updates: string[] = [];
    const values: any[] = [];

    if (dto.tipo !== undefined) {
      updates.push('tipo = ?');
      values.push(dto.tipo);
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
      `UPDATE monedas SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.db.execute('DELETE FROM monedas WHERE id = ?', [id]);

    return { deleted: true, id };
  }

  // Método para actualizar cantidad de una moneda (incrementar/decrementar)
  async updateCantidad(id: number, cantidad: number) {
    await this.db.execute(
      'UPDATE monedas SET cantidad = cantidad + ? WHERE id = ?',
      [cantidad, id],
    );
    return this.findOne(id);
  }

  // Actualizar cantidad por tipo de moneda
  async updateCantidadByTipo(tipo: string, cantidad: number) {
    await this.db.execute(
      'UPDATE monedas SET cantidad = cantidad + ? WHERE tipo = ?',
      [cantidad, tipo],
    );
    return this.findByTipo(tipo);
  }

  // Obtener monedas disponibles para dar cambio
  async getMonedasDisponibles() {
    const [rows] = await this.db.query<any[]>(
      'SELECT * FROM monedas WHERE cantidad > 0 ORDER BY CAST(tipo AS DECIMAL(10,2)) DESC',
    );
    return rows;
  }

  // Verificar si hay suficientes monedas de un tipo
  async verificarDisponibilidad(tipo: string, cantidadNecesaria: number) {
    const moneda = await this.findByTipo(tipo);
    if (!moneda) {
      return false;
    }
    return moneda.cantidad >= cantidadNecesaria;
  }

  // Obtener valor total en la máquina
  async getValorTotal() {
    const [rows] = await this.db.query<any[]>(
      `SELECT 
        SUM(CAST(tipo AS DECIMAL(10,2)) * cantidad) as valor_total,
        COUNT(*) as tipos_moneda,
        SUM(cantidad) as total_monedas
      FROM monedas`,
    );
    return rows[0];
  }

  // Monedas con bajo stock
  async findBajoStock(minimo: number = 10) {
    const [rows] = await this.db.query(
      'SELECT * FROM monedas WHERE cantidad <= ? ORDER BY CAST(tipo AS DECIMAL(10,2)) DESC',
      [minimo],
    );
    return rows;
  }
}
