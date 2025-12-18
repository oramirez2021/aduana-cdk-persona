import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as oracledb from 'oracledb';

/**
 * Configuración TypeORM híbrida para Oracle 11g
 * 
 * Este archivo combina:
 * - Enfoque de pweb: Inicialización centralizada de Oracle Client + TypeORM
 * - Enfoque de manifiesto: Soporte para conexiones directas con oracledb
 * 
 * IMPORTANTE: Esta función inicializa Oracle Client en modo Thick UNA SOLA VEZ
 * para toda la aplicación. No es necesario inicializarlo en otros servicios.
 */
export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  // ===================================================================
  // PASO 1: Inicializar Oracle Client en modo Thick
  // (Requerido para compatibilidad con Oracle 11g)
  // ===================================================================
  
  // Soportar ambas nomenclaturas de variables de entorno
  const oracleHome = configService.get<string>('ORACLE_HOME') || 
                     configService.get<string>('ORACLE_CLIENT_LIB_DIR');
  
  if (oracleHome) {
    try {
      oracledb.initOracleClient({ 
        libDir: oracleHome,
        configDir: undefined,
        errorUrl: undefined
      });
      console.log('✅ Oracle Client inicializado en modo Thick');
      console.log(`   Path: ${oracleHome}`);
    } catch (error) {
      // Si ya está inicializado, está bien (puede suceder en hot-reload)
      if (error.message && error.message.includes('already initialized')) {
        console.warn('⚠️  Oracle Client ya inicializado (esperado en desarrollo)');
      } else {
        console.error('❌ Error inicializando Oracle Client:', error.message);
        throw error;
      }
    }
  } else {
    console.error('❌ ORACLE_HOME ni ORACLE_CLIENT_LIB_DIR configurados');
    throw new Error('Oracle Client path not configured. Set ORACLE_HOME or ORACLE_CLIENT_LIB_DIR');
  }

  // ===================================================================
  // PASO 2: Obtener credenciales de base de datos
  // (Soportar nomenclatura de pweb y manifiesto)
  // ===================================================================
  
  const dbHost = configService.get<string>('ORACLE_HOST') || 
                 configService.get<string>('DB_HOST');
  const dbPort = configService.get<number>('ORACLE_PORT') || 
                 configService.get<number>('DB_PORT') || 1521;
  const dbUsername = configService.get<string>('ORACLE_USERNAME') || 
                     configService.get<string>('DB_USERNAME');
  const dbPassword = configService.get<string>('ORACLE_PASSWORD') || 
                     configService.get<string>('DB_PASSWORD');
  const dbServiceName = configService.get<string>('ORACLE_SID') || 
                        configService.get<string>('DB_NAME');

  if (!dbHost || !dbUsername || !dbPassword || !dbServiceName) {
    throw new Error('Missing required Oracle database configuration');
  }

  console.log('📊 Configuración de base de datos:');
  console.log(`   Host: ${dbHost}:${dbPort}`);
  console.log(`   Service Name: ${dbServiceName}`);
  console.log(`   User: ${dbUsername}`);

  // ===================================================================
  // PASO 3: Retornar configuración de TypeORM
  // ===================================================================
  
  return {
    type: 'oracle',
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    serviceName: dbServiceName,
    
    // Autodescubrimiento de entidades TypeORM
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    
    // ⚠️ NUNCA usar synchronize en producción con Oracle
    synchronize: false,
    
    // Logging para desarrollo
    logging: configService.get<string>('NODE_ENV') === 'development',
    
    // Configuración de reintentos
    retryAttempts: 3,
    retryDelay: 3000,
    
    // Configuraciones específicas para Oracle
    extra: {
      connectTimeout: 60000,
      requestTimeout: 60000,
      useUTC: false,
    },
  };
};





