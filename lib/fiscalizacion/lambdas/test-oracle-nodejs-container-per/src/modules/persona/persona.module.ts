import { Module } from '@nestjs/common';
import { PersonaController } from './controllers/persona.controller';
import { PersonaService } from './services/persona.service';

/**
 * Módulo de Personas
 * 
 * Proporciona endpoints para buscar y consultar información de personas.
 * Usa SQL directo con BaseOracleService para compatibilidad con Oracle 11g.
 */
@Module({
  controllers: [PersonaController],
  providers: [PersonaService],
  exports: [PersonaService]
})
export class PersonaModule {}

