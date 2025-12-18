import { ApiProperty } from '@nestjs/swagger';
import { PersonaResponseDto } from './persona-response.dto';

/**
 * DTO para respuesta de lista de personas
 * Sigue el patrón de otros endpoints del proyecto (manifiestos, guías)
 */
export class PersonasListResponseDto {
  @ApiProperty({
    description: 'Lista de personas encontradas que coinciden con los filtros',
    type: [PersonaResponseDto]
  })
  personas: PersonaResponseDto[];

  @ApiProperty({
    description: 'Número de personas devueltas en esta respuesta',
    example: 2
  })
  rowsCount: number;
}

