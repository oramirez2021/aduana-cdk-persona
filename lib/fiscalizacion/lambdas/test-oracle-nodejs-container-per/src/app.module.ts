import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './config/typeorm.config';
import { validationSchema } from './config/validation.schema';
import { PersonaModule } from './modules/persona/persona.module';

/**
 * Módulo principal de la aplicación
 * 
 * Este módulo configura:
 * - TypeORM con Oracle en modo Thick (compatibilidad Oracle 11g)
 * - Validación de variables de entorno (soporta nomenclatura pweb y manifiesto)
 * - Configuración global de la aplicación
 * 
 * Patrón híbrido implementado:
 * - TypeORM para operaciones CRUD simples
 * - oracledb directo para queries complejas (mediante BaseOracleService)
 */
@Module({
  imports: [
    // ===================================================================
    // Configuración Global
    // ===================================================================
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: { 
        allowUnknown: true, // Permitir variables no definidas en schema
        abortEarly: true    // Detener en el primer error
      },
    }),

    // ===================================================================
    // TypeORM con Oracle (modo Thick)
    // ===================================================================
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),

    // ===================================================================
    // Módulos de la Aplicación
    // ===================================================================
    PersonaModule,   // Módulo de personas (búsqueda por nombre, RUT, etc.)
    
    // Aquí se agregarán más módulos según se requiera:
    // - CatalogosModule
    // etc.
  ],
})
export class AppModule {}





