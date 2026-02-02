import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createPool } from 'mysql2/promise';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'MYSQL_POOL',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return createPool({
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get<string>('DB_PORT')),
          user: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          waitForConnections: true,
          connectionLimit: 10,
        });
      },
    },
  ],
  exports: ['MYSQL_POOL'], // 🔴 CLAVE
})
export class DatabaseModule {}
