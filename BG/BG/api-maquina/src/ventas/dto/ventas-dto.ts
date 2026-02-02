// dto/compra.dto.ts
export class MonedaInsertadaDto {
  tipo: string;
  cantidad: number;
}

export class CompraDto {
  producto_id: number;
  monto_pagado: number;
  monedas_insertadas: MonedaInsertadaDto[];
}

export class VerificarCompraDto {
  producto_id: number;
  monto_pagado: number;
}
