import * as Joi from 'joi';

/**
 * Schema de validación para variables de entorno
 * 
 * Este schema combina las nomenclaturas de:
 * - pweb: ORACLE_HOST, ORACLE_PORT, ORACLE_USERNAME, ORACLE_PASSWORD, ORACLE_SID, ORACLE_CLIENT_LIB_DIR
 * - manifiesto: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, ORACLE_HOME
 * 
 * Ambas nomenclaturas son opcionales, pero al menos una debe estar configurada.
 * El archivo typeorm.config.ts se encarga de usar la que esté disponible.
 */
export const validationSchema = Joi.object({
  // ===================================================================
  // Configuración General
  // ===================================================================
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number().default(3000),
  
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info'),

  // ===================================================================
  // Oracle Database - Nomenclatura estilo "manifiesto"
  // (Preferida por ser más corta y clara)
  // ===================================================================
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().optional().default(1521),
  DB_USERNAME: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),
  DB_NAME: Joi.string().optional(),
  
  // ===================================================================
  // Oracle Database - Nomenclatura estilo "pweb" (Alias)
  // (Soportada para compatibilidad con proyecto pweb)
  // ===================================================================
  ORACLE_HOST: Joi.string().optional(),
  ORACLE_PORT: Joi.number().optional(),
  ORACLE_USERNAME: Joi.string().optional(),
  ORACLE_PASSWORD: Joi.string().optional(),
  ORACLE_SID: Joi.string().optional(),
  ORACLE_DATABASE: Joi.string().optional(),
  
  // ===================================================================
  // Oracle Instant Client
  // ===================================================================
  // Nomenclatura estilo "manifiesto"
  ORACLE_HOME: Joi.string().optional(),
  
  // Nomenclatura estilo "pweb"
  ORACLE_CLIENT_LIB_DIR: Joi.string().optional(),
  
  // Variable de sistema (Linux/Mac)
  LD_LIBRARY_PATH: Joi.string().optional(),

  // ===================================================================
  // Autenticación y Seguridad
  // ===================================================================
  JWT_PUBLIC_KEY: Joi.string().allow('').optional(),
  
  CORS_ORIGIN: Joi.string().default('*'),
  
  // Cognito configuration
  COGNITO_JWKS_URI: Joi.string().optional(),
  COGNITO_ISSUER: Joi.string().optional(),
  COGNITO_CLIENT_ID: Joi.string().optional(),

  // ===================================================================
  // AWS / Lambda (Opcional)
  // ===================================================================
  AWS_REGION: Joi.string().optional(),
  AWS_LAMBDA_FUNCTION_NAME: Joi.string().optional(),
  
  // ===================================================================
  // SQS (Opcional)
  // ===================================================================
  SQS_QUEUE_URL: Joi.string().optional(),
}).custom((value, helpers) => {
  // ===================================================================
  // Validación Cruzada: Al menos una nomenclatura debe estar completa
  // ===================================================================
  
  // Verificar si configuración "manifiesto" está completa
  const hasManifiestoConfig = value.DB_HOST && value.DB_USERNAME && 
                               value.DB_PASSWORD && value.DB_NAME;
  
  // Verificar si configuración "pweb" está completa
  const hasPwebConfig = value.ORACLE_HOST && value.ORACLE_USERNAME && 
                        value.ORACLE_PASSWORD && value.ORACLE_SID;
  
  if (!hasManifiestoConfig && !hasPwebConfig) {
    return helpers.error('any.custom', {
      message: 'Database configuration incomplete. Provide either:\n' +
               '  - DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME (manifiesto style) OR\n' +
               '  - ORACLE_HOST, ORACLE_USERNAME, ORACLE_PASSWORD, ORACLE_SID (pweb style)'
    });
  }
  
  // Verificar Oracle Client path
  const hasOracleClientPath = value.ORACLE_HOME || value.ORACLE_CLIENT_LIB_DIR;
  
  if (!hasOracleClientPath) {
    return helpers.error('any.custom', {
      message: 'Oracle Client path not configured. Provide either:\n' +
               '  - ORACLE_HOME (manifiesto style) OR\n' +
               '  - ORACLE_CLIENT_LIB_DIR (pweb style)'
    });
  }
  
  return value;
});





