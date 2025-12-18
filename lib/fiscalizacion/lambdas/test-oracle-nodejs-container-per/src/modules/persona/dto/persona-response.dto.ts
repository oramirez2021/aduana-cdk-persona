import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para respuesta individual de persona
 * Basado en el método QSearchPersona de PerAdmPersonas.java
 * Columnas retornadas: Id, Activa, Nombre, ValorIdentificador (RUT), CodigoAduana, NacionalExtranjera
 */
export class PersonaResponseDto {
  @ApiProperty({
    description: 'ID único de la persona en la base de datos',
    example: 123456
  })
  id: number;

  @ApiProperty({
    description: 'Indica si la persona está activa',
    example: 'S',
    enum: ['S', 'N']
  })
  activa: string;

  @ApiProperty({
    description: 'Nombre completo de la persona',
    example: 'ARAOS, MARCELO'
  })
  nombre: string;

  @ApiProperty({
    description: 'Código de aduana de la persona',
    example: '12345'
  })
  codigoAduana: string;

  @ApiProperty({
    description: 'Indica si es nacional o extranjera',
    example: 'N',
    enum: ['N', 'E']
  })
  nacionalExtranjera: string;

  @ApiProperty({
    description: 'RUT de la persona (ValorIdentificador del query)',
    example: '5165701-2'
  })
  rut: string;
}

