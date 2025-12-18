"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fastify_1 = __importDefault(require("fastify"));
const aws_lambda_1 = __importDefault(require("@fastify/aws-lambda"));
const app_module_1 = require("./app.module");
let cachedServer;
async function createNestServer() {
    if (!cachedServer) {
        const fastifyApp = (0, fastify_1.default)();
        try {
            const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter(fastifyApp));
            app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
            app.enableCors({ origin: process.env.CORS_ORIGIN || '*', credentials: true });
            // Swagger simplificado para Fastify
            //const cfg = new DocumentBuilder().setTitle('Aduanas Service').setVersion('1.0.0').addBearerAuth().build();
            //const doc = SwaggerModule.createDocument(app, cfg);
            const stage = process.env.STAGE || 'dev';
            const cfg = new swagger_1.DocumentBuilder()
                .setTitle('Aduanas Service')
                .setVersion('1.0.0')
                .addBearerAuth()
                .addServer(`/${stage}`, `API Gateway ${stage} stage`)
                .build();
            const doc = swagger_1.SwaggerModule.createDocument(app, cfg);
            // Endpoint simple para obtener la documentación JSON
            fastifyApp.get('/api/docs-json', async (request, reply) => {
                return doc;
            });
            // Función para generar HTML de documentación con Swagger UI
            const generateDocsHTML = () => `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Aduanas Service API</title>
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
          <style>
            html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin:0; background: #fafafa; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
          <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
          <script>
            window.onload = function() {
              const ui = SwaggerUIBundle({
                url: window.location.pathname.replace('/api/docs', '/api/docs-json'),
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
              });
            };
          </script>
        </body>
        </html>
      `;
            // Endpoint simple para mostrar documentación básica (sin barra)
            fastifyApp.get('/api/docs', async (request, reply) => {
                reply.type('text/html');
                return generateDocsHTML();
            });
            // Endpoint simple para mostrar documentación básica (con barra)
            fastifyApp.get('/api/docs/', async (request, reply) => {
                reply.type('text/html');
                return generateDocsHTML();
            });
            await app.init();
            // Health check endpoint (después de inicializar NestJS)
            fastifyApp.get('/api/health', async (request, reply) => {
                return { status: 'OK', ts: new Date().toISOString() };
            });
            // Obtener la instancia de Fastify desde el adapter de NestJS
            const fastifyInstance = app.getHttpAdapter().getInstance();
            cachedServer = (0, aws_lambda_1.default)(fastifyInstance);
        }
        catch (error) {
            console.log('Error initializing NestJS app:', error.message);
            throw error;
        }
    }
    return cachedServer;
}
const handler = async (event, context) => {
    // Health check directo sin pasar por NestJS
    if (event.path === '/api/health' && event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify({
                status: 'OK',
                ts: new Date().toISOString(),
                service: 'Aduanas Service',
                version: '1.0.0'
            })
        };
    }
    // Detectar si es un evento SQS
    if (event.Records && event.Records[0]?.eventSource === 'aws:sqs') {
        console.log('Processing SQS event - SQS handler removed');
        return {
            statusCode: 501,
            body: JSON.stringify({ error: 'SQS handler not implemented' })
        };
    }
    // Detectar si es un evento HTTP (API Gateway)
    if (event.httpMethod || event.requestContext) {
        console.log('Processing HTTP event');
        const server = await createNestServer();
        return server(event, context);
    }
    // Fallback para otros tipos de eventos
    console.log('Processing unknown event type, falling back to HTTP handler');
    const server = await createNestServer();
    return server(event, context);
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDRCQUEwQjtBQUMxQix1Q0FBMkM7QUFDM0MsK0RBQTBEO0FBQzFELDJDQUFnRDtBQUNoRCw2Q0FBaUU7QUFDakUsc0RBQThCO0FBQzlCLHFFQUE0QztBQUU1Qyw2Q0FBeUM7QUFHekMsSUFBSSxZQUFpQixDQUFDO0FBRXRCLEtBQUssVUFBVSxnQkFBZ0I7SUFDN0IsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ2xCLE1BQU0sVUFBVSxHQUFHLElBQUEsaUJBQU8sR0FBRSxDQUFDO1FBRTdCLElBQUksQ0FBQztZQUNILE1BQU0sR0FBRyxHQUFHLE1BQU0sa0JBQVcsQ0FBQyxNQUFNLENBQUMsc0JBQVMsRUFBRSxJQUFJLGlDQUFjLENBQUMsVUFBaUIsQ0FBQyxDQUFDLENBQUM7WUFFdkYsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLHVCQUFjLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pHLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRTlFLG9DQUFvQztZQUNwQyw0R0FBNEc7WUFDNUcscURBQXFEO1lBQ3JELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQztZQUN6QyxNQUFNLEdBQUcsR0FBRyxJQUFJLHlCQUFlLEVBQUU7aUJBQzlCLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztpQkFDM0IsVUFBVSxDQUFDLE9BQU8sQ0FBQztpQkFDbkIsYUFBYSxFQUFFO2lCQUNmLFNBQVMsQ0FBQyxJQUFJLEtB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QUFDLEdBQUcsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1FBQzFELE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLDZCQUE2QixFQUFFLENBQUM7U0FDL0QsQ0FBQztJQUNKLENBQUM7SUFFRCw4Q0FBOEM7SUFDOUMsSUFBSSxLQUFLLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFFckMsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3hDLE9BQU8sTUFBTSxDQUFDLEtBQTZCLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVELHVDQUF1QztJQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLDZEQUE2RCxDQUFDLENBQUM7SUFDM0UsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3hDLE9BQU8sTUFBTSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNoQyxDQUFDLENBQUM7QUF6Q1csUUFBQSxPQUFPLFdBeUNsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAncmVmbGVjdC1tZXRhZGF0YSc7XG5pbXBvcnQgeyBOZXN0RmFjdG9yeSB9IGZyb20gJ0BuZXN0anMvY29yZSc7XG5pbXBvcnQgeyBGYXN0aWZ5QWRhcHRlciB9IGZyb20gJ0BuZXN0anMvcGxhdGZvcm0tZmFzdGlmeSc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uUGlwZSB9IGZyb20gJ0BuZXN0anMvY29tbW9uJztcbmltcG9ydCB7IFN3YWdnZXJNb2R1bGUsIERvY3VtZW50QnVpbGRlciB9IGZyb20gJ0BuZXN0anMvc3dhZ2dlcic7XG5pbXBvcnQgZmFzdGlmeSBmcm9tICdmYXN0aWZ5JztcbmltcG9ydCBhd3NsYW1iZGEgZnJvbSAnQGZhc3RpZnkvYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0LCBDb250ZXh0LCBTUVNFdmVudCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQXBwTW9kdWxlIH0gZnJvbSAnLi9hcHAubW9kdWxlJztcblxuXG5sZXQgY2FjaGVkU2VydmVyOiBhbnk7XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU5lc3RTZXJ2ZXIoKSB7XG4gIGlmICghY2FjaGVkU2VydmVyKSB7XG4gICAgY29uc3QgZmFzdGlmeUFwcCA9IGZhc3RpZnkoKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhcHAgPSBhd2FpdCBOZXN0RmFjdG9yeS5jcmVhdGUoQXBwTW9kdWxlLCBuZXcgRmFzdGlmeUFkYXB0ZXIoZmFzdGlmeUFwcCBhcyBhbnkpKTtcblxuICAgICAgYXBwLnVzZUdsb2JhbFBpcGVzKG5ldyBWYWxpZGF0aW9uUGlwZSh7IHdoaXRlbGlzdDogdHJ1ZSwgZm9yYmlkTm9uV2hpdGVsaXN0ZWQ6IHRydWUsIHRyYW5zZm9ybTogdHJ1ZSB9KSk7XG4gICAgICBhcHAuZW5hYmxlQ29ycyh7IG9yaWdpbjogcHJvY2Vzcy5lbnYuQ09SU19PUklHSU4gfHwgJyonLCBjcmVkZW50aWFsczogdHJ1ZSB9KTtcblxuICAgICAgLy8gU3dhZ2dlciBzaW1wbGlmaWNhZG8gcGFyYSBGYXN0aWZ5XG4gICAgICAvL2NvbnN0IGNmZyA9IG5ldyBEb2N1bWVudEJ1aWxkZXIoKS5zZXRUaXRsZSgnQWR1YW5hcyBTZXJ2aWNlJykuc2V0VmVyc2lvbignMS4wLjAnKS5hZGRCZWFyZXJBdXRoKCkuYnVpbGQoKTtcbiAgICAgIC8vY29uc3QgZG9jID0gU3dhZ2dlck1vZHVsZS5jcmVhdGVEb2N1bWVudChhcHAsIGNmZyk7XG4gICAgICBjb25zdCBzdGFnZSA9IHByb2Nlc3MuZW52LlNUQUdFIHx8ICdkZXYnO1xuICAgICAgY29uc3QgY2ZnID0gbmV3IERvY3VtZW50QnVpbGRlcigpXG4gICAgICAgIC5zZXRUaXRsZSgnQWR1YW5hcyBTZXJ2aWNlJylcbiAgICAgICAgLnNldFZlcnNpb24oJzEuMC4wJylcbiAgICAgICAgLmFkZEJlYXJlckF1dGgoKVxuICAgICAgICAuYWRkU2VydmVyKGAvJHtzdGFnZX1gLCBgQVBJIEdhdGV3YXkgJHtzdGFnZX0gc3RhZ2VgKVxuICAgICAgICAuYnVpbGQoKTtcbiAgICAgIGNvbnN0IGRvYyA9IFN3YWdnZXJNb2R1bGUuY3JlYXRlRG9jdW1lbnQoYXBwLCBjZmcpO1xuXG5cbiAgICAgIC8vIEVuZHBvaW50IHNpbXBsZSBwYXJhIG9idGVuZXIgbGEgZG9jdW1lbnRhY2nDs24gSlNPTlxuICAgICAgZmFzdGlmeUFwcC5nZXQoJy9hcGkvZG9jcy1qc29uJywgYXN5bmMgKHJlcXVlc3QsIHJlcGx5KSA9PiB7XG4gICAgICAgIHJldHVybiBkb2M7XG4gICAgICB9KTtcblxuICAgICAgLy8gRnVuY2nDs24gcGFyYSBnZW5lcmFyIEhUTUwgZGUgZG9jdW1lbnRhY2nDs24gY29uIFN3YWdnZXIgVUlcbiAgICAgIGNvbnN0IGdlbmVyYXRlRG9jc0hUTUwgPSAoKSA9PiBgXG4gICAgICAgIDwhRE9DVFlQRSBodG1sPlxuICAgICAgICA8aHRtbD5cbiAgICAgICAgPGhlYWQ+XG4gICAgICAgICAgPHRpdGxlPkFkdWFuYXMgU2VydmljZSBBUEk8L3RpdGxlPlxuICAgICAgICAgIDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiaHR0cHM6Ly91bnBrZy5jb20vc3dhZ2dlci11aS1kaXN0QDQuMTUuNS9zd2FnZ2VyLXVpLmNzc1wiIC8+XG4gICAgICAgICAgPHN0eWxlPlxuICAgICAgICAgICAgaHRtbCB7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IG92ZXJmbG93OiAtbW96LXNjcm9sbGJhcnMtdmVydGljYWw7IG92ZXJmbG93LXk6IHNjcm9sbDsgfVxuICAgICAgICAgICAgKiwgKjpiZWZvcmUsICo6YWZ0ZXIgeyBib3gtc2l6aW5nOiBpbmhlcml0OyB9XG4gICAgICAgICAgICBib2R5IHsgbWFyZ2luOjA7IGJhY2tncm91bmQ6ICNmYWZhZmE7IH1cbiAgICAgICAgICA8L3N0eWxlPlxuICAgICAgICA8L2hlYWQ+XG4gICAgICAgIDxib2R5PlxuICAgICAgICAgIDxkaXYgaWQ9XCJzd2FnZ2VyLXVpXCI+PC9kaXY+XG4gICAgICAgICAgPHNjcmlwdCBzcmM9XCJodHRwczovL3VucGtnLmNvbS9zd2FnZ2VyLXVpLWRpc3RANC4xNS41L3N3YWdnZXItdWktYnVuZGxlLmpzXCI+PC9zY3JpcHQ+XG4gICAgICAgICAgPHNjcmlwdCBzcmM9XCJodHRwczovL3VucGtnLmNvbS9zd2FnZ2VyLXVpLWRpc3RANC4xNS41L3N3YWdnZXItdWktc3RhbmRhbG9uZS1wcmVzZXQuanNcIj48L3NjcmlwdD5cbiAgICAgICAgICA8c2NyaXB0PlxuICAgICAgICAgICAgd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBjb25zdCB1aSA9IFN3YWdnZXJVSUJ1bmRsZSh7XG4gICAgICAgICAgICAgICAgdXJsOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgnL2FwaS9kb2NzJywgJy9hcGkvZG9jcy1qc29uJyksXG4gICAgICAgICAgICAgICAgZG9tX2lkOiAnI3N3YWdnZXItdWknLFxuICAgICAgICAgICAgICAgIGRlZXBMaW5raW5nOiB0cnVlLFxuICAgICAgICAgICAgICAgIHByZXNldHM6IFtcbiAgICAgICAgICAgICAgICAgIFN3YWdnZXJVSUJ1bmRsZS5wcmVzZXRzLmFwaXMsXG4gICAgICAgICAgICAgICAgICBTd2FnZ2VyVUlTdGFuZGFsb25lUHJlc2V0XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgICAgICBTd2FnZ2VyVUlCdW5kbGUucGx1Z2lucy5Eb3dubG9hZFVybFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgbGF5b3V0OiBcIlN0YW5kYWxvbmVMYXlvdXRcIlxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgPC9zY3JpcHQ+XG4gICAgICAgIDwvYm9keT5cbiAgICAgICAgPC9odG1sPlxuICAgICAgYDtcblxuICAgICAgLy8gRW5kcG9pbnQgc2ltcGxlIHBhcmEgbW9zdHJhciBkb2N1bWVudGFjacOzbiBiw6FzaWNhIChzaW4gYmFycmEpXG4gICAgICBmYXN0aWZ5QXBwLmdldCgnL2FwaS9kb2NzJywgYXN5bmMgKHJlcXVlc3QsIHJlcGx5KSA9PiB7XG4gICAgICAgIHJlcGx5LnR5cGUoJ3RleHQvaHRtbCcpO1xuICAgICAgICByZXR1cm4gZ2VuZXJhdGVEb2NzSFRNTCgpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEVuZHBvaW50IHNpbXBsZSBwYXJhIG1vc3RyYXIgZG9jdW1lbnRhY2nDs24gYsOhc2ljYSAoY29uIGJhcnJhKVxuICAgICAgZmFzdGlmeUFwcC5nZXQoJy9hcGkvZG9jcy8nLCBhc3luYyAocmVxdWVzdCwgcmVwbHkpID0+IHtcbiAgICAgICAgcmVwbHkudHlwZSgndGV4dC9odG1sJyk7XG4gICAgICAgIHJldHVybiBnZW5lcmF0ZURvY3NIVE1MKCk7XG4gICAgICB9KTtcblxuICAgICAgYXdhaXQgYXBwLmluaXQoKTtcblxuICAgICAgLy8gSGVhbHRoIGNoZWNrIGVuZHBvaW50IChkZXNwdcOpcyBkZSBpbmljaWFsaXphciBOZXN0SlMpXG4gICAgICBmYXN0aWZ5QXBwLmdldCgnL2FwaS9oZWFsdGgnLCBhc3luYyAocmVxdWVzdCwgcmVwbHkpID0+IHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzOiAnT0snLCB0czogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH07XG4gICAgICB9KTtcblxuICAgICAgLy8gT2J0ZW5lciBsYSBpbnN0YW5jaWEgZGUgRmFzdGlmeSBkZXNkZSBlbCBhZGFwdGVyIGRlIE5lc3RKU1xuICAgICAgY29uc3QgZmFzdGlmeUluc3RhbmNlID0gYXBwLmdldEh0dHBBZGFwdGVyKCkuZ2V0SW5zdGFuY2UoKTtcbiAgICAgIGNhY2hlZFNlcnZlciA9IGF3c2xhbWJkYShmYXN0aWZ5SW5zdGFuY2UpO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBpbml0aWFsaXppbmcgTmVzdEpTIGFwcDonLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICB9XG4gIHJldHVybiBjYWNoZWRTZXJ2ZXI7XG59XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSkgPT4ge1xuICAvLyBIZWFsdGggY2hlY2sgZGlyZWN0byBzaW4gcGFzYXIgcG9yIE5lc3RKU1xuICBpZiAoZXZlbnQucGF0aCA9PT0gJy9hcGkvaGVhbHRoJyAmJiBldmVudC5odHRwTWV0aG9kID09PSAnR0VUJykge1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZScsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ0dFVCwgUE9TVCwgUFVULCBERUxFVEUsIE9QVElPTlMnXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdGF0dXM6ICdPSycsXG4gICAgICAgIHRzOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIHNlcnZpY2U6ICdBZHVhbmFzIFNlcnZpY2UnLFxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnXG4gICAgICB9KVxuICAgIH07XG4gIH1cblxuICAvLyBEZXRlY3RhciBzaSBlcyB1biBldmVudG8gU1FTXG4gIGlmIChldmVudC5SZWNvcmRzICYmIGV2ZW50LlJlY29yZHNbMF0/LmV2ZW50U291cmNlID09PSAnYXdzOnNxcycpIHtcbiAgICBjb25zb2xlLmxvZygnUHJvY2Vzc2luZyBTUVMgZXZlbnQgLSBTUVMgaGFuZGxlciByZW1vdmVkJyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDUwMSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdTUVMgaGFuZGxlciBub3QgaW1wbGVtZW50ZWQnIH0pXG4gICAgfTtcbiAgfVxuXG4gIC8vIERldGVjdGFyIHNpIGVzIHVuIGV2ZW50byBIVFRQIChBUEkgR2F0ZXdheSlcbiAgaWYgKGV2ZW50Lmh0dHBNZXRob2QgfHwgZXZlbnQucmVxdWVzdENvbnRleHQpIHtcbiAgICBjb25zb2xlLmxvZygnUHJvY2Vzc2luZyBIVFRQIGV2ZW50Jyk7XG5cbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCBjcmVhdGVOZXN0U2VydmVyKCk7XG4gICAgcmV0dXJuIHNlcnZlcihldmVudCBhcyBBUElHYXRld2F5UHJveHlFdmVudCwgY29udGV4dCk7XG4gIH1cblxuICAvLyBGYWxsYmFjayBwYXJhIG90cm9zIHRpcG9zIGRlIGV2ZW50b3NcbiAgY29uc29sZS5sb2coJ1Byb2Nlc3NpbmcgdW5rbm93biBldmVudCB0eXBlLCBmYWxsaW5nIGJhY2sgdG8gSFRUUCBoYW5kbGVyJyk7XG4gIGNvbnN0IHNlcnZlciA9IGF3YWl0IGNyZWF0ZU5lc3RTZXJ2ZXIoKTtcbiAgcmV0dXJuIHNlcnZlcihldmVudCwgY29udGV4dCk7XG59OyJdfQ==