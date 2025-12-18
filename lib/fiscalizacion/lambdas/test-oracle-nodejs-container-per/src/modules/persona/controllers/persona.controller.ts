import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse
} from '@nestjs/swagger';
import { Public } from '../../../auth/public.decorator';
import { PersonaService } from '../services/persona.service';
import { ConsultaPersonasDto } from '../dto/consulta-personas.dto';
import { PersonasListResponseDto } from '../dto/personas-list-response.dto';

/**
 * Controller para gestión de personas
 * 
 * Endpoints para buscar y consultar información de personas en el sistema.
 * Basado en la funcionalidad de AdmPersonas del monolito Java.
 */
@ApiTags('personas')
@Controller('personas')
export class PersonaController {
  private readonly logger = new Logger(PersonaController.name);

  constructor(
    private readonly personaService: PersonaService
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Buscar personas',
    description: `
Obtiene lista de personas activas filtradas por tipo de operador. Permite búsqueda parcial por nombre (case-insensitive).

**Características:**
- Búsqueda case-insensitive: funciona con mayúsculas, minúsculas o mixto
- Búsqueda parcial: encuentra coincidencias parciales en nombre
- Filtro obligatorio por tipo de operador
- Solo personas activas (p.activa = 'S')
- Obtiene RUT desde Per_valoridentificador

**Tipos de operador disponibles:**
AGENTE_NAVES, LINEAS_AEREAS, ESTIBAS_DESESTIBA, PROVEEDOR, MULTIMODAL, CARGA, FORWARDER, MUDANZAS, ALMACENISTA, COURIER, AGENTE_ADUANAS, AGENTE_CABOTAJE, ENTIDAD_CERTIFICADORA, RETIRO_GARANTIZADO, DEPOSITO, ZF, OP_CONTENEDOR

**Ejemplos de uso:**
- \`GET /personas?tipoOperador=COURIER\` - Buscar por tipo de operador
- \`GET /personas?nombre=ARAOS&tipoOperador=COURIER\` - Buscar por nombre y tipo de operador
- \`GET /personas?nombre=araos&tipoOperador=FORWARDER\` - Mismo resultado (case-insensitive)
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de personas encontradas que coinciden con los filtros',
    type: PersonasListResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de entrada inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: ['nombre no puede exceder 100 caracteres', 'nombre contiene caracteres no permitidos']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor al consultar Oracle',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Error interno al consultar personas' },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  async buscarPersonas(@Query() consultaDto: ConsultaPersonasDto): Promise<PersonasListResponseDto> {
    try {
      this.logger.log(`🔍 Consulta personas - Parámetros: ${JSON.stringify(consultaDto)}`);

      const personas = await this.personaService.buscarPersonas(consultaDto);

      return {
        personas,
        rowsCount: personas.length
      };
    } catch (error) {
      this.logger.error(`❌ Error en buscarPersonas: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error interno al consultar personas',
        error: 'Internal Server Error'
      });
    }
  }
}

