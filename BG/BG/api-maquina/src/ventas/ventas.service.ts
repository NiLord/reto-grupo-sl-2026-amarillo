import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';

export interface MonedaInsertada {
  tipo: string;
  cantidad: number;
}

export interface CompraDto {
  producto_id: number;
  monto_pagado: number;
  monedas_insertadas: MonedaInsertada[];
}

export interface VerificarCompraDto {
  producto_id: number;
  monto_pagado: number;
}

export interface ResultadoCompra {
  exito: boolean;
  mensaje: string;
  producto?: any;
  precio?: number;
  monto_pagado?: number;
  cambio?: number;
  monedas_cambio?: Array<{
    tipo: string;
    cantidad: number;
    valor_unitario: number;
  }>;
}

@Injectable()
export class VentasService {
  constructor(@Inject('MYSQL_POOL') private readonly db: Pool) {}

  // Verificar si se puede hacer la compra (antes de insertar monedas)
  async verificarCompra(dto: VerificarCompraDto): Promise<ResultadoCompra> {
    // 1. Verificar producto existe y tiene stock
    const [productos] = await this.db.query<any[]>(
      'SELECT * FROM productos WHERE id = ?',
      [dto.producto_id],
    );

    if (!productos.length) {
      return {
        exito: false,
        mensaje: 'Producto no encontrado',
      };
    }

    const producto = productos[0];

    if (producto.cantidad <= 0) {
      return {
        exito: false,
        mensaje: 'Producto agotado',
      };
    }

    // 2. Verificar monto suficiente
    const precioProducto = parseFloat(producto.precio);
    const montoPagado = parseFloat(dto.monto_pagado.toString());

    if (montoPagado < precioProducto) {
      return {
        exito: false,
        mensaje: `Monto insuficiente. Precio: $${precioProducto.toFixed(2)}, Ingresado: $${montoPagado.toFixed(2)}`,
        precio: precioProducto,
        monto_pagado: montoPagado,
      };
    }

    // 3. Calcular cambio necesario
    const cambioNecesario =
      Math.round((montoPagado - precioProducto) * 100) / 100;

    if (cambioNecesario === 0) {
      return {
        exito: true,
        mensaje: 'Compra lista. Monto exacto.',
        producto,
        precio: precioProducto,
        monto_pagado: montoPagado,
        cambio: 0,
        monedas_cambio: [],
      };
    }

    // 4. Verificar si hay cambio disponible
    const [monedas] = await this.db.query<any[]>(
      'SELECT * FROM monedas WHERE cantidad > 0 ORDER BY CAST(tipo AS DECIMAL(10,2)) DESC',
    );

    const monedasCambio = this.calcularCambio(cambioNecesario, monedas);

    if (!monedasCambio) {
      return {
        exito: false,
        mensaje:
          'No hay suficiente cambio disponible. Intente con monto exacto.',
        producto,
        precio: precioProducto,
        cambio: cambioNecesario,
      };
    }

    return {
      exito: true,
      mensaje: 'Compra verificada correctamente',
      producto,
      precio: precioProducto,
      monto_pagado: montoPagado,
      cambio: cambioNecesario,
      monedas_cambio: monedasCambio,
    };
  }

  // Realizar la compra (después de insertar monedas)
  // Realizar la compra (después de insertar monedas)
  async realizarCompra(dto: CompraDto): Promise<ResultadoCompra> {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Verificar producto con lock
      const [productos] = await connection.query<any[]>(
        'SELECT * FROM productos WHERE id = ? FOR UPDATE',
        [dto.producto_id],
      );

      if (!productos.length) {
        throw new BadRequestException('Producto no encontrado');
      }

      const producto = productos[0];
      const precioProducto = parseFloat(producto.precio);
      const montoPagado = parseFloat(dto.monto_pagado.toString());

      console.log('=== INICIO COMPRA ===');
      console.log('Precio producto:', precioProducto);
      console.log('Monto pagado:', montoPagado);
      console.log('Monedas insertadas:', dto.monedas_insertadas);

      if (producto.cantidad <= 0) {
        throw new BadRequestException('Producto agotado');
      }

      // 2. Verificar monto
      if (montoPagado < precioProducto) {
        throw new BadRequestException(
          `Monto insuficiente. Precio: $${precioProducto.toFixed(2)}`,
        );
      }

      // 3. Calcular cambio necesario (ANTES de tocar el inventario)
      const cambioNecesario =
        Math.round((montoPagado - precioProducto) * 100) / 100;
      console.log('Cambio necesario:', cambioNecesario);

      let monedasCambio: Array<{
        tipo: string;
        cantidad: number;
        valor_unitario: number;
      }> = [];

      // 4. Si necesita cambio, calcularlo ANTES de modificar inventario
      if (cambioNecesario > 0) {
        const [monedasActuales] = await connection.query<any[]>(
          'SELECT * FROM monedas WHERE cantidad > 0 ORDER BY CAST(tipo AS DECIMAL(10,2)) DESC FOR UPDATE',
        );

        console.log('Monedas disponibles antes:', monedasActuales);

        const resultadoCambio = this.calcularCambio(
          cambioNecesario,
          monedasActuales,
        );

        if (!resultadoCambio) {
          throw new BadRequestException(
            `No hay suficiente cambio disponible. Cambio requerido: $${cambioNecesario.toFixed(2)}`,
          );
        }

        monedasCambio = resultadoCambio;

        console.log('Monedas de cambio calculadas:', monedasCambio);

        // Verificar que hay suficientes monedas
        for (const monedaCambio of monedasCambio) {
          const monedaEnInventario = monedasActuales.find(
            (m) => m.tipo === monedaCambio.tipo,
          );

          if (
            !monedaEnInventario ||
            monedaEnInventario.cantidad < monedaCambio.cantidad
          ) {
            throw new BadRequestException(
              `No hay suficientes monedas de $${monedaCambio.tipo} para dar cambio`,
            );
          }
        }

        // 5. PRIMERO descontar las monedas de cambio
        for (const moneda of monedasCambio) {
          console.log(
            `Descontando ${moneda.cantidad} monedas de $${moneda.tipo}`,
          );

          const resultado = await connection.execute(
            'UPDATE monedas SET cantidad = cantidad - ? WHERE tipo = ?',
            [moneda.cantidad, moneda.tipo],
          );

          if ((resultado as any)[0].affectedRows === 0) {
            throw new BadRequestException(
              `No se pudo descontar monedas de cambio tipo ${moneda.tipo}`,
            );
          }
        }
      }

      // 6. DESPUÉS agregar las monedas insertadas al inventario
      for (const moneda of dto.monedas_insertadas) {
        console.log(`Agregando ${moneda.cantidad} monedas de $${moneda.tipo}`);

        const resultado = await connection.execute(
          'UPDATE monedas SET cantidad = cantidad + ? WHERE tipo = ?',
          [moneda.cantidad, moneda.tipo],
        );

        if ((resultado as any)[0].affectedRows === 0) {
          throw new BadRequestException(
            `No se pudo actualizar el inventario de monedas tipo ${moneda.tipo}`,
          );
        }
      }

      // 7. Reducir stock del producto
      await connection.execute(
        'UPDATE productos SET cantidad = cantidad - 1 WHERE id = ?',
        [dto.producto_id],
      );

      await connection.commit();

      // 8. El cambio es SIEMPRE monto_pagado - precio (no el total de monedas)
      console.log('=== COMPRA EXITOSA ===');
      console.log('Cambio retornado:', cambioNecesario);
      console.log('Monedas de cambio:', monedasCambio);

      return {
        exito: true,
        mensaje: '¡Compra realizada con éxito!',
        producto,
        precio: precioProducto,
        monto_pagado: montoPagado,
        cambio: cambioNecesario, // Este es el cambio correcto
        monedas_cambio: monedasCambio,
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error en compra:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Calcular cambio usando algoritmo greedy (MEJORADO)
  private calcularCambio(
    monto: number,
    monedasDisponibles: any[],
  ): Array<{ tipo: string; cantidad: number; valor_unitario: number }> | null {
    const resultado: Array<{
      tipo: string;
      cantidad: number;
      valor_unitario: number;
    }> = [];

    // Convertir a centavos para evitar problemas de punto flotante
    let restanteCentavos = Math.round(monto * 100);

    for (const moneda of monedasDisponibles) {
      if (restanteCentavos <= 0) break;

      const valorMoneda = parseFloat(moneda.tipo);
      const valorMonedaCentavos = Math.round(valorMoneda * 100);
      const cantidadDisponible = moneda.cantidad;

      // Calcular cuántas monedas de este tipo necesitamos
      const cantidadNecesaria = Math.floor(
        restanteCentavos / valorMonedaCentavos,
      );
      const cantidadAUsar = Math.min(cantidadNecesaria, cantidadDisponible);

      if (cantidadAUsar > 0) {
        resultado.push({
          tipo: moneda.tipo,
          cantidad: cantidadAUsar,
          valor_unitario: valorMoneda,
        });

        restanteCentavos -= cantidadAUsar * valorMonedaCentavos;
      }
    }

    // Si aún queda cambio por dar, no se puede completar
    if (restanteCentavos > 0) {
      console.log(
        'No se pudo dar cambio completo. Restante:',
        restanteCentavos / 100,
      );
      return null;
    }

    return resultado;
  }

  // Verificar cambio disponible
  async verificarCambioDisponible(producto_id: number, monto_pagado: number) {
    const [productos] = await this.db.query<any[]>(
      'SELECT precio FROM productos WHERE id = ?',
      [producto_id],
    );

    if (!productos.length) {
      throw new BadRequestException('Producto no encontrado');
    }

    const precioProducto = parseFloat(productos[0].precio);
    const montoPagado = parseFloat(monto_pagado.toString());
    const cambioNecesario =
      Math.round((montoPagado - precioProducto) * 100) / 100;

    if (cambioNecesario <= 0) {
      return {
        tiene_cambio: true,
        cambio: 0,
        monedas: [],
        mensaje: 'Monto exacto, no requiere cambio',
      };
    }

    const [monedas] = await this.db.query<any[]>(
      'SELECT * FROM monedas WHERE cantidad > 0 ORDER BY CAST(tipo AS DECIMAL(10,2)) DESC',
    );

    const monedasCambio = this.calcularCambio(cambioNecesario, monedas);

    return {
      tiene_cambio: monedasCambio !== null,
      cambio: cambioNecesario,
      monedas: monedasCambio || [],
      mensaje: monedasCambio
        ? `Cambio disponible: $${cambioNecesario.toFixed(2)}`
        : 'No hay suficiente cambio disponible',
    };
  }

  // Devolver monedas si se cancela
  async devolverMonedas(monedas_insertadas: MonedaInsertada[]) {
    const totalDevuelto = monedas_insertadas.reduce(
      (sum, m) => sum + parseFloat(m.tipo) * m.cantidad,
      0,
    );

    return {
      exito: true,
      mensaje: 'Transacción cancelada. Monedas devueltas.',
      monedas_devueltas: monedas_insertadas,
      total_devuelto: Math.round(totalDevuelto * 100) / 100,
    };
  }

  // Método de diagnóstico para verificar estado de monedas
  async obtenerEstadoMonedas() {
    const [monedas] = await this.db.query<any[]>(
      'SELECT * FROM monedas ORDER BY CAST(tipo AS DECIMAL(10,2)) DESC',
    );

    const total = monedas.reduce(
      (sum, m) => sum + parseFloat(m.tipo) * m.cantidad,
      0,
    );

    return {
      monedas,
      total_disponible: Math.round(total * 100) / 100,
      cantidad_tipos: monedas.length,
    };
  }
}
