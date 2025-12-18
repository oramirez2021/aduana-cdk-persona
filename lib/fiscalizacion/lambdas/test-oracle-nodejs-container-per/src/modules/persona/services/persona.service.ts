import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseOracleService } from '../../../shared/base-oracle.service';
import { ConsultaPersonasDto } from '../dto/consulta-personas.dto';
import { PersonaResponseDto } from '../dto/persona-response.dto';
import * as oracledb from 'oracledb';

/**
 * Servicio para consultas de personas
 * Extiende BaseOracleService para usar SQL directo (compatible con Oracle 11g)
 * 
 * Basado en el método QSearchPersona de PerAdmPersonas.java
 */
@Injectable()
export class PersonaService extends BaseOracleService {
  constructor(configService: ConfigService) {
    super(configService);
  }

  /**
   * Buscar personas por nombre y tipo de operador
   * 
   * Implementa búsqueda de personas activas filtradas por tipo de operador:
   * - Búsqueda case-insensitive por nombre (LIKE con UPPER)
   * - Filtro obligatorio por tipo de operador
   * - Solo personas activas (p.activa = 'S')
   * - Obtiene RUT desde Per_valoridentificador
   * 
   * @param consultaDto Parámetros de búsqueda
   * @returns Lista de personas que coinciden con los filtros
   */
  async buscarPersonas(consultaDto: ConsultaPersonasDto): Promise<PersonaResponseDto[]> {
    let connection: oracledb.Connection | undefined;

    try {
      connection = await this.getOracleConnection();

      // Sanitización adicional de parámetros
      const nombreSanitizado = consultaDto.nombre?.trim() || '';
      const tipoOperador = consultaDto.tipoOperador;

      this.logger.log(
        `🔍 Buscando personas - Nombre: ${nombreSanitizado || '(vacío)'}, TipoOperador: ${tipoOperador}`
      );

      // Query SQL exacto proporcionado
      const query = `SELECT DISTINCT P.id                 AS Id,
                P.activa             AS Activa,
                P.nombre             AS Nombre,
                P.codigoaduana       AS CodigoAduana,
                P.nacionalextranjera AS NacionalExtranjera,
                V.valor              AS RUT
FROM   per_persona P,
       per_valoridentificador V
WHERE  V.persona = P.id
       AND p.activa = 'S'
       AND ( :nombre IS NULL
              OR :nombre = ''
              OR Upper(P.nombre) LIKE Upper('%'
                                            || :nombre
                                            || '%') )
       AND tipoidentificador = 'RUT'
       AND V.valor IN (SELECT DISTINCT Replace(rpta.rut, '.', '') RUT
                       FROM   (SELECT po.nombre_fantasia              AS
                                      fantasia,
                                      po.rut_operador                 AS rut,
                                      TOC.tipo_operador               AS
                                      operacion,
                                      TOC.codaduanacontrol            AS
                                      aduanaalmacen,
                                      po.razon_social                 AS razon,
                                      po.direccion                    AS direcc,
                                      po.ciudad                       AS city,
                                      po.aduana_control               AS aduana,
                                      po.codigo_agente                AS
                                      codagente,
                                      toc.estadooper                  AS esta,
                                      toc.estado                      AS esta_do
                                      ,
toc.num_resolucion              AS numres,
toc.fecha_resolucion            AS fechares,
po.fono                         AS telefono,
po.fax_ppal                     AS fax,
po.mail                         AS correo,
(SELECT codigo
 FROM   admsirote.nwop_tipo_operador
 WHERE  id = toc.tipo_operador) descripcion
FROM   admsirote.nwop_operacion_aduana toc
LEFT JOIN admsirote.nwop_operador po
       ON opadu_rut_operador = rut_operador) rpta
WHERE  rpta.esta = 1
AND rpta.esta_do = '1'
AND UPPER(rpta.descripcion) = UPPER(:tipoOperador))
ORDER  BY P.nombre ASC`;

      const result = await connection.execute(
        query,
        {
          nombre: nombreSanitizado || null,
          tipoOperador: tipoOperador
        },
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT
        }
      );

      // Mapear resultados a DTOs (camelCase)
      // Oracle puede devolver nombres en mayúsculas o según el alias del query
      const personas: PersonaResponseDto[] = (result.rows || []).map((row: any) => ({
        id: Number(row.ID || row.Id || 0),
        activa: (row.ACTIVA || row.Activa || 'N').toString(),
        nombre: (row.NOMBRE || row.Nombre || '').toString(),
        codigoAduana: (row.CODIGOADUANA || row.CodigoAduana || '').toString(),
        nacionalExtranjera: (row.NACIONALEXTRANJERA || row.NacionalExtranjera || '').toString(),
        rut: (row.RUT || '').toString()
      }));

      this.logger.log(`📊 Personas encontradas: ${personas.length}`);

      return personas;
    } catch (error) {
      this.logger.error(`❌ Error en buscarPersonas: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (connection) {
        await connection.close();
        this.logger.debug('✅ Conexión Oracle cerrada');
      }
    }
  }
}

