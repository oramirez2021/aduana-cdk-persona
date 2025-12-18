import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoOperador } from '../enums/tipo-operador.enum';

/**
 * DTO para consulta de personas
 * Permite filtrar personas por nombre y tipo de operador
 * Basado en el método QSearchPersona de PerAdmPersonas.java
 */
export class ConsultaPersonasDto {
  @ApiPropertyOptional({
    description: 'Nombre para buscar personas (búsqueda parcial, case-insensitive)',
    example: 'ARAOS',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'nombre no puede exceder 100 caracteres'
  })
  @Matches(/^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ.,;:()]+$/, {
    message: 'nombre contiene caracteres no permitidos'
  })
  @Transform(({ value }) => {
    if (!value) return '';
    // Escapar caracteres especiales de LIKE: %, _, \
    return value.trim()
      .replace(/\\/g, '\\\\')  // Escapar backslash
      .replace(/%/g, '\\%')    // Escapar %
      .replace(/_/g, '\\_');   // Escapar _
  })
  nombre?: string;

  @ApiProperty({
    description: 'Tipo de operador para filtrar personas (obligatorio)',
    example: TipoOperador.COURIER,
    enum: TipoOperador,
    enumName: 'TipoOperador'
  })
  @IsNotEmpty({
    message: 'tipoOperador es obligatorio'
  })
  @IsEnum(TipoOperador, {
    message: 'tipoOperador debe ser uno de los valores válidos'
  })
  tipoOperador: TipoOperador;
}

