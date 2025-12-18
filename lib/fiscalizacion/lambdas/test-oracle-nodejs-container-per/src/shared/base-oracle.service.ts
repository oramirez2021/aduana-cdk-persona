import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oracledb from 'oracledb';

/**
 * Servicio base para conexiones directas a Oracle
 * 
 * Este servicio está inspirado en el oracle.service.ts del proyecto manifiesto,
 * pero NO inicializa Oracle Client (ya lo hace typeorm.config.ts).
 * 
 * ## Cuándo usar este servicio:
 * 
 * Extiende esta clase cuando necesites ejecutar queries SQL puros que TypeORM
 * no puede manejar eficientemente:
 * 
 * - ✅ Funciones PL/SQL del paquete courier_consultas
 * - ✅ Queries con XMLTYPE
 * - ✅ CTEs (Common Table Expressions) complejos
 * - ✅ Paginación con ROWNUM
 * - ✅ Procedimientos almacenados
 * - ✅ Queries con lógica Oracle específica (EXTRACTVALUE, NVL, DECODE, etc.)
 * 
 * ## Cuándo NO usar este servicio:
 * 
 * Para operaciones simples, usa TypeORM en su lugar:
 * 
 * - ❌ SELECT simples con WHERE
 * - ❌ INSERT, UPDATE, DELETE básicos
 * - ❌ JOINs simples (2-3 tablas)
 * - ❌ Queries que se beneficien de type-safety
 * 
 * ## Ejemplo de uso:
 * 
 * ```typescript
 * @Injectable()
 * export class MiServicioOracleService extends BaseOracleService {
 *   async consultaCompleja(params: any): Promise<any[]> {
 *     let connection;
 *     try {
 *       connection = await this.getOracleConnection();
 *       
 *       const query = `
 *         SELECT 
 *           D.ID,
 *           courier_consultas.gtime_getproductosasstring(D.ID) as productos
 *         FROM DOCUMENTOS.DOCDOCUMENTOBASE D
 *         WHERE D.ACTIVO = :activo
 *       `;
 *       
 *       const result = await connection.execute(query, { activo: 'S' });
 *       return this.mapResultToObjects(result);
 *     } finally {
 *       if (connection) {
 *         await connection.close();
 *       }
 *     }
 *   }
 * }
 * ```
 */
@Injectable()
export class BaseOracleService {
  protected readonly logger: Logger;

  constructor(protected readonly configService: ConfigService) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Obtener conexión Oracle directa
   * 
   * IMPORTANTE: 
   * - Esta conexión debe cerrarse manualmente con connection.close()
   * - Usar siempre try/finally para garantizar el cierre
   * - Oracle Client ya fue inicializado por typeorm.config.ts
   * 
   * @returns Conexión Oracle directa
   */
  protected async getOracleConnection(): Promise<oracledb.Connection> {
    // Soportar ambas nomenclaturas de variables de entorno
    const dbHost = this.configService.get<string>('ORACLE_HOST') || 
                   this.configService.get<string>('DB_HOST');
    const dbPort = this.configService.get<number>('ORACLE_PORT') || 
                   this.configService.get<number>('DB_PORT') || 1521;
    const dbUsername = this.configService.get<string>('ORACLE_USERNAME') || 
                       this.configService.get<string>('DB_USERNAME');
    const dbPassword = this.configService.get<string>('ORACLE_PASSWORD') || 
                       this.configService.get<string>('DB_PASSWORD');
    const dbSid = this.configService.get<string>('ORACLE_SID') || 
                  this.configService.get<string>('DB_NAME');

    if (!dbHost || !dbUsername || !dbPassword || !dbSid) {
      throw new Error('Missing required Oracle database configuration');
    }

    try {
      const connection = await oracledb.getConnection({
        user: dbUsername,
        password: dbPassword,
        connectString: `${dbHost}:${dbPort}/${dbSid}`
      });

      this.logger.debug('✅ Conexión Oracle directa establecida');
      return connection;
    } catch (error) {
      this.logger.error('❌ Error conectando a Oracle:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Ejecutar query SQL puro con manejo automático de conexión
   * 
   * Este método es un helper que maneja automáticamente la apertura
   * y cierre de la conexión.
   * 
   * @param sql Query SQL a ejecutar
   * @param params Parámetros bind para el query
   * @param options Opciones de ejecución de oracledb
   * @returns Array de objetos mapeados desde los resultados
   */
  protected async executeQuery<T = any>(
    sql: string, 
    params: any = {},
    options: oracledb.ExecuteOptions = {}
  ): Promise<T[]> {
    let connection: oracledb.Connection;
    try {
      connection = await this.getOracleConnection();
      const result = await connection.execute(sql, params, options);
      
      // Mapear resultados a objetos usando metaData
      return this.mapResultToObjects<T>(result);
    } finally {
      if (connection) {
        await connection.close();
        this.logger.debug('✅ Conexión Oracle cerrada');
      }
    }
  }

  /**
   * Mapear resultado de Oracle a array de objetos
   * 
   * Convierte el formato de rows + metaData de oracledb a un array
   * de objetos JavaScript con propiedades nombradas.
   * 
   * @param result Resultado de connection.execute()
   * @returns Array de objetos con propiedades nombradas
   */
  protected mapResultToObjects<T = any>(result: oracledb.Result<any>): T[] {
    if (!result.rows || !result.metaData) {
      return [];
    }

    return result.rows.map(row => {
      const obj: any = {};
      result.metaData.forEach((col, index) => {
        obj[col.name] = row[index];
      });
      return obj as T;
    });
  }

  /**
   * Convertir fecha a formato Oracle (DD/MM/YYYY)
   * 
   * @param dateString Fecha en formato ISO (YYYY-MM-DD) o DD/MM/YYYY
   * @returns Fecha en formato DD/MM/YYYY
   */
  protected convertToOracleDate(dateString: string): string {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    // Si ya está en formato DD/MM/YYYY, retornar
    if (dateString.includes('/')) {
      return dateString;
    }

    // Convertir de YYYY-MM-DD a DD/MM/YYYY
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    return dateString;
  }

  /**
   * Validar formato de fecha DD/MM/YYYY o DD-MM-YYYY
   * 
   * @param dateString Fecha a validar
   * @returns true si el formato es válido
   */
  protected isValidDate(dateString: string): boolean {
    if (!dateString) return false;

    const dateRegex = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;
    const match = dateString.match(dateRegex);

    if (!match) return false;

    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.getFullYear() == parseInt(year) &&
           date.getMonth() == parseInt(month) - 1 &&
           date.getDate() == parseInt(day);
  }
}





