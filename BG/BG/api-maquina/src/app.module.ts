import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductosModule } from './productos/productos.module';
import { DatabaseModule } from './database.module';
import { CantidadModule } from './cantidad/cantidad.module';
import { MonedasModule } from './monedas/monedas.module';
import { VentasModule } from './ventas/ventas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ProductosModule,
    CantidadModule,
    MonedasModule,
    VentasModule,
  ],
})
export class AppModule {}
