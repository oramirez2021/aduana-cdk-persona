import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as compression from 'compression';
import * as morgan from 'morgan';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

const helmet = require('helmet');

/**
 * Bootstrap de la aplicación NestJS
 * 
 * Configuración incluida:
 * - Helmet: Seguridad HTTP headers
 * - Compression: Compresión gzip
 * - Morgan: Logging HTTP requests
 * - CORS: Configuración flexible
 * - Swagger: Documentación automática
 * - Validation Pipe: Validación global de DTOs
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // ===================================================================
  // Middlewares de Seguridad y Performance
  // ===================================================================
  app.use(helmet());
  app.use(compression());
  app.use(morgan('combined'));

  // ===================================================================
  // Validación Global
  // ===================================================================
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Eliminar propiedades no decoradas
    forbidNonWhitelisted: true, // Lanzar error si hay propiedades extras
    transform: true,            // Transformar a tipos definidos en DTOs
  }));

  // ===================================================================
  // CORS
  // ===================================================================
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ===================================================================
  // Swagger Documentation
  // ===================================================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fiscalización Service')
    .setDescription(
      'Microservicio de Fiscalización con enfoque híbrido TypeORM + Oracle DB\n\n' +
      '## Arquitectura\n' +
      '- **TypeORM**: Para operaciones CRUD simples (SELECT, INSERT, UPDATE, DELETE)\n' +
      '- **Oracle DB Directo**: Para queries complejas (funciones PL/SQL, CTEs, XMLTYPE, etc.)\n\n' +
      '## Compatibilidad\n' +
      '- Oracle 11g en modo Thick Client\n' +
      '- Node.js 20.x\n' +
      '- NestJS 10.x'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('ejemplo', 'Endpoints de ejemplo mostrando el patrón híbrido')
    .addTag('health', 'Health checks y diagnóstico')
    .build();
  
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDoc);

  // ===================================================================
  // Health Check Simple
  // ===================================================================
  app.use('/api/health', (req: any, res: any) => {
    res.json({ 
      status: 'OK', 
      service: 'minimis-wfizc-fiscalizacion-ms',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // ===================================================================
  // Iniciar Servidor
  // ===================================================================
  const port = process.env.PORT || 3000;
  await app.listen(port as number);
  
  logger.log('🚀 Aplicación iniciada exitosamente');
  logger.log(`📡 Server: http://localhost:${port}`);
  logger.log(`📚 Docs:   http://localhost:${port}/api/docs`);
  logger.log(`❤️  Health: http://localhost:${port}/api/health`);
  logger.log(`🏗️  Modo:   ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();

