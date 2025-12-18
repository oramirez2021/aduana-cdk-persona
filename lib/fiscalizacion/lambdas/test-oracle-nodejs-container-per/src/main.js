"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const compression = __importStar(require("compression"));
const morgan = __importStar(require("morgan"));
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
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
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger('Bootstrap');
    // ===================================================================
    // Middlewares de Seguridad y Performance
    // ===================================================================
    app.use(helmet());
    app.use(compression());
    app.use(morgan('combined'));
    // ===================================================================
    // Validación Global
    // ===================================================================
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true, // Eliminar propiedades no decoradas
        forbidNonWhitelisted: true, // Lanzar error si hay propiedades extras
        transform: true, // Transformar a tipos definidos en DTOs
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
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Fiscalización Service')
        .setDescription('Microservicio de Fiscalización con enfoque híbrido TypeORM + Oracle DB\n\n' +
        '## Arquitectura\n' +
        '- **TypeORM**: Para operaciones CRUD simples (SELECT, INSERT, UPDATE, DELETE)\n' +
        '- **Oracle DB Directo**: Para queries complejas (funciones PL/SQL, CTEs, XMLTYPE, etc.)\n\n' +
        '## Compatibilidad\n' +
        '- Oracle 11g en modo Thick Client\n' +
        '- Node.js 20.x\n' +
        '- NestJS 10.x')
        .setVersion('1.0.0')
        .addBearerAuth()
        .addTag('ejemplo', 'Endpoints de ejemplo mostrando el patrón híbrido')
        .addTag('health', 'Health checks y diagnóstico')
        .build();
    const swaggerDoc = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, swaggerDoc);
    // ===================================================================
    // Health Check Simple
    // ===================================================================
    app.use('/api/health', (req, res) => {
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
    await app.listen(port);
    logger.log('🚀 Aplicación iniciada exitosamente');
    logger.log(`📡 Server: http://localhost:${port}`);
    logger.log(`📚 Docs:   http://localhost:${port}/api/docs`);
    logger.log(`❤️  Health: http://localhost:${port}/api/health`);
    logger.log(`🏗️  Modo:   ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0QkFBMEI7QUFDMUIsdUNBQTJDO0FBQzNDLDJDQUF3RDtBQUN4RCx5REFBMkM7QUFDM0MsK0NBQWlDO0FBQ2pDLDZDQUFpRTtBQUNqRSw2Q0FBeUM7QUFFekMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWpDOzs7Ozs7Ozs7O0dBVUc7QUFDSCxLQUFLLFVBQVUsU0FBUztJQUN0QixNQUFNLEdBQUcsR0FBRyxNQUFNLGtCQUFXLENBQUMsTUFBTSxDQUFDLHNCQUFTLENBQUMsQ0FBQztJQUNoRCxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV2QyxzRUFBc0U7SUFDdEUseUNBQXlDO0lBQ3pDLHNFQUFzRTtJQUN0RSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZCLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFFNUIsc0VBQXNFO0lBQ3RFLG9CQUFvQjtJQUNwQixzRUFBc0U7SUFDdEUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLHVCQUFjLENBQUM7UUFDcEMsU0FBUyxFQUFFLElBQUksRUFBWSxvQ0FBb0M7UUFDL0Qsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLHlDQUF5QztRQUNyRSxTQUFTLEVBQUUsSUFBSSxFQUFhLHdDQUF3QztLQUNyRSxDQUFDLENBQUMsQ0FBQztJQUVKLHNFQUFzRTtJQUN0RSxPQUFPO0lBQ1Asc0VBQXNFO0lBQ3RFLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDYixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksR0FBRztRQUN0QyxXQUFXLEVBQUUsSUFBSTtRQUNqQixPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQztRQUM3RCxjQUFjLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixDQUFDO0tBQ3RFLENBQUMsQ0FBQztJQUVILHNFQUFzRTtJQUN0RSx3QkFBd0I7SUFDeEIsc0VBQXNFO0lBQ3RFLE1BQU0sYUFBYSxHQUFHLElBQUkseUJBQWUsRUFBRTtTQUN4QyxRQUFRLENBQUMsdUJBQXVCLENBQUM7U0FDakMsY0FBYyxDQUNiLDRFQUE0RTtRQUM1RSxtQkFBbUI7UUFDbkIsaUZBQWlGO1FBQ2pGLDZGQUE2RjtRQUM3RixxQkFBcUI7UUFDckIscUNBQXFDO1FBQ3JDLGtCQUFrQjtRQUNsQixlQUFlLENBQ2hCO1NBQ0EsVUFBVSxDQUFDLE9BQU8sQ0FBQztTQUNuQixhQUFhLEVBQUU7U0FDZixNQUFNLENBQUMsU0FBUyxFQUFFLGtEQUFrRCxDQUFDO1NBQ3JFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsNkJBQTZCLENBQUM7U0FDL0MsS0FBSyxFQUFFLENBQUM7SUFFWCxNQUFNLFVBQVUsR0FBRyx1QkFBYSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDcEUsdUJBQWEsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUVqRCxzRUFBc0U7SUFDdEUsc0JBQXNCO0lBQ3RCLHNFQUFzRTtJQUN0RSxHQUFHLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQVEsRUFBRSxHQUFRLEVBQUUsRUFBRTtRQUM1QyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsTUFBTSxFQUFFLElBQUk7WUFDWixPQUFPLEVBQUUsZ0NBQWdDO1lBQ3pDLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtZQUNuQyxPQUFPLEVBQUUsT0FBTztTQUNqQixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILHNFQUFzRTtJQUN0RSxtQkFBbUI7SUFDbkIsc0VBQXNFO0lBQ3RFLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQztJQUN0QyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBYyxDQUFDLENBQUM7SUFFakMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0lBQ2xELE1BQU0sQ0FBQyxHQUFHLENBQUMsK0JBQStCLElBQUksRUFBRSxDQUFDLENBQUM7SUFDbEQsTUFBTSxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsSUFBSSxXQUFXLENBQUMsQ0FBQztJQUMzRCxNQUFNLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxJQUFJLGFBQWEsQ0FBQyxDQUFDO0lBQzlELE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLGFBQWEsRUFBRSxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQVMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJztcbmltcG9ydCB7IE5lc3RGYWN0b3J5IH0gZnJvbSAnQG5lc3Rqcy9jb3JlJztcbmltcG9ydCB7IFZhbGlkYXRpb25QaXBlLCBMb2dnZXIgfSBmcm9tICdAbmVzdGpzL2NvbW1vbic7XG5pbXBvcnQgKiBhcyBjb21wcmVzc2lvbiBmcm9tICdjb21wcmVzc2lvbic7XG5pbXBvcnQgKiBhcyBtb3JnYW4gZnJvbSAnbW9yZ2FuJztcbmltcG9ydCB7IFN3YWdnZXJNb2R1bGUsIERvY3VtZW50QnVpbGRlciB9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5pbXBvcnQgeyBBcHBNb2R1bGUgfSBmcm9tICcuL2FwcC5tb2R1bGUnO1xuXG5jb25zdCBoZWxtZXQgPSByZXF1aXJlKCdoZWxtZXQnKTtcblxuLyoqXG4gKiBCb290c3RyYXAgZGUgbGEgYXBsaWNhY2nDs24gTmVzdEpTXG4gKiBcbiAqIENvbmZpZ3VyYWNpw7NuIGluY2x1aWRhOlxuICogLSBIZWxtZXQ6IFNlZ3VyaWRhZCBIVFRQIGhlYWRlcnNcbiAqIC0gQ29tcHJlc3Npb246IENvbXByZXNpw7NuIGd6aXBcbiAqIC0gTW9yZ2FuOiBMb2dnaW5nIEhUVFAgcmVxdWVzdHNcbiAqIC0gQ09SUzogQ29uZmlndXJhY2nDs24gZmxleGlibGVcbiAqIC0gU3dhZ2dlcjogRG9jdW1lbnRhY2nDs24gYXV0b23DoXRpY2FcbiAqIC0gVmFsaWRhdGlvbiBQaXBlOiBWYWxpZGFjacOzbiBnbG9iYWwgZGUgRFRPc1xuICovXG5hc3luYyBmdW5jdGlvbiBib290c3RyYXAoKSB7XG4gIGNvbnN0IGFwcCA9IGF3YWl0IE5lc3RGYWN0b3J5LmNyZWF0ZShBcHBNb2R1bGUpO1xuICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdCb290c3RyYXAnKTtcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIE1pZGRsZXdhcmVzIGRlIFNlZ3VyaWRhZCB5IFBlcmZvcm1hbmNlXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgYXBwLnVzZShoZWxtZXQoKSk7XG4gIGFwcC51c2UoY29tcHJlc3Npb24oKSk7XG4gIGFwcC51c2UobW9yZ2FuKCdjb21iaW5lZCcpKTtcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIFZhbGlkYWNpw7NuIEdsb2JhbFxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGFwcC51c2VHbG9iYWxQaXBlcyhuZXcgVmFsaWRhdGlvblBpcGUoe1xuICAgIHdoaXRlbGlzdDogdHJ1ZSwgICAgICAgICAgIC8vIEVsaW1pbmFyIHByb3BpZWRhZGVzIG5vIGRlY29yYWRhc1xuICAgIGZvcmJpZE5vbldoaXRlbGlzdGVkOiB0cnVlLCAvLyBMYW56YXIgZXJyb3Igc2kgaGF5IHByb3BpZWRhZGVzIGV4dHJhc1xuICAgIHRyYW5zZm9ybTogdHJ1ZSwgICAgICAgICAgICAvLyBUcmFuc2Zvcm1hciBhIHRpcG9zIGRlZmluaWRvcyBlbiBEVE9zXG4gIH0pKTtcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIENPUlNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBhcHAuZW5hYmxlQ29ycyh7XG4gICAgb3JpZ2luOiBwcm9jZXNzLmVudi5DT1JTX09SSUdJTiB8fCAnKicsXG4gICAgY3JlZGVudGlhbHM6IHRydWUsXG4gICAgbWV0aG9kczogWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnREVMRVRFJywgJ1BBVENIJywgJ09QVElPTlMnXSxcbiAgICBhbGxvd2VkSGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbicsICdYLVJlcXVlc3RlZC1XaXRoJ10sXG4gIH0pO1xuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gU3dhZ2dlciBEb2N1bWVudGF0aW9uXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY29uc3Qgc3dhZ2dlckNvbmZpZyA9IG5ldyBEb2N1bWVudEJ1aWxkZXIoKVxuICAgIC5zZXRUaXRsZSgnRmlzY2FsaXphY2nDs24gU2VydmljZScpXG4gICAgLnNldERlc2NyaXB0aW9uKFxuICAgICAgJ01pY3Jvc2VydmljaW8gZGUgRmlzY2FsaXphY2nDs24gY29uIGVuZm9xdWUgaMOtYnJpZG8gVHlwZU9STSArIE9yYWNsZSBEQlxcblxcbicgK1xuICAgICAgJyMjIEFycXVpdGVjdHVyYVxcbicgK1xuICAgICAgJy0gKipUeXBlT1JNKio6IFBhcmEgb3BlcmFjaW9uZXMgQ1JVRCBzaW1wbGVzIChTRUxFQ1QsIElOU0VSVCwgVVBEQVRFLCBERUxFVEUpXFxuJyArXG4gICAgICAnLSAqKk9yYWNsZSBEQiBEaXJlY3RvKio6IFBhcmEgcXVlcmllcyBjb21wbGVqYXMgKGZ1bmNpb25lcyBQTC9TUUwsIENURXMsIFhNTFRZUEUsIGV0Yy4pXFxuXFxuJyArXG4gICAgICAnIyMgQ29tcGF0aWJpbGlkYWRcXG4nICtcbiAgICAgICctIE9yYWNsZSAxMWcgZW4gbW9kbyBUaGljayBDbGllbnRcXG4nICtcbiAgICAgICctIE5vZGUuanMgMjAueFxcbicgK1xuICAgICAgJy0gTmVzdEpTIDEwLngnXG4gICAgKVxuICAgIC5zZXRWZXJzaW9uKCcxLjAuMCcpXG4gICAgLmFkZEJlYXJlckF1dGgoKVxuICAgIC5hZGRUYWcoJ2VqZW1wbG8nLCAnRW5kcG9pbnRzIGRlIGVqZW1wbG8gbW9zdHJhbmRvIGVsIHBhdHLDs24gaMOtYnJpZG8nKVxuICAgIC5hZGRUYWcoJ2hlYWx0aCcsICdIZWFsdGggY2hlY2tzIHkgZGlhZ27Ds3N0aWNvJylcbiAgICAuYnVpbGQoKTtcbiAgXG4gIGNvbnN0IHN3YWdnZXJEb2MgPSBTd2FnZ2VyTW9kdWxlLmNyZWF0ZURvY3VtZW50KGFwcCwgc3dhZ2dlckNvbmZpZyk7XG4gIFN3YWdnZXJNb2R1bGUuc2V0dXAoJ2FwaS9kb2NzJywgYXBwLCBzd2FnZ2VyRG9jKTtcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIEhlYWx0aCBDaGVjayBTaW1wbGVcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBhcHAudXNlKCcvYXBpL2hlYWx0aCcsIChyZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcbiAgICByZXMuanNvbih7IFxuICAgICAgc3RhdHVzOiAnT0snLCBcbiAgICAgIHNlcnZpY2U6ICdtaW5pbWlzLXdmaXpjLWZpc2NhbGl6YWNpb24tbXMnLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB2ZXJzaW9uOiAnMS4wLjAnXG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gSW5pY2lhciBTZXJ2aWRvclxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNvbnN0IHBvcnQgPSBwcm9jZXNzLmVudi5QT1JUIHx8IDMwMDA7XG4gIGF3YWl0IGFwcC5saXN0ZW4ocG9ydCBhcyBudW1iZXIpO1xuICBcbiAgbG9nZ2VyLmxvZygn8J+agCBBcGxpY2FjacOzbiBpbmljaWFkYSBleGl0b3NhbWVudGUnKTtcbiAgbG9nZ2VyLmxvZyhg8J+ToSBTZXJ2ZXI6IGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fWApO1xuICBsb2dnZXIubG9nKGDwn5OaIERvY3M6ICAgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L2FwaS9kb2NzYCk7XG4gIGxvZ2dlci5sb2coYOKdpO+4jyAgSGVhbHRoOiBodHRwOi8vbG9jYWxob3N0OiR7cG9ydH0vYXBpL2hlYWx0aGApO1xuICBsb2dnZXIubG9nKGDwn4+X77iPICBNb2RvOiAgICR7cHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ2RldmVsb3BtZW50J31gKTtcbn1cblxuYm9vdHN0cmFwKCk7XG5cbiJdfQ==