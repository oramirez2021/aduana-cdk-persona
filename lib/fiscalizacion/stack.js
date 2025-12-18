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
exports.FiscalizacionStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const path = __importStar(require("path"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const aws_ecr_assets_1 = require("aws-cdk-lib/aws-ecr-assets");
/**
 * Stack de Fiscalización con múltiples Lambdas y API Gateway
 * Nomenclatura: {project}_{client}_{usecase}_{resource}_{stage}
 * Ejemplo: data_lake_mut_fisca_lambda_verificar_dev
 */
class FiscalizacionStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Propiedades públicas para acceder a los recursos
        this.lambdas = {};
        const stage = props?.stage || '';
        const project = props?.project || '';
        const client = props?.client || '';
        const useCase = props?.useCase || '';
        // Función helper para generar nombres con el formato: project_client_usecase_resource_stage
        const generateResourceName = (resource) => {
            return `${project}_${client}_${useCase}_${resource}_${stage}`;
        };
        // Función helper para generar nombres de exports compatibles con CloudFormation (sin underscores)
        const generateExportName = (resource) => {
            return `${project.replace(/_/g, '-')}-${client}-${useCase}-${resource}-${stage}-per`;
        };
        // ========================================
        // Lambda Functions - Múltiples lambdas para fiscalización
        // ========================================
        const vpc = ec2.Vpc.fromVpcAttributes(this, 'ExistingVPC', {
            vpcId: 'vpc-07ab3ade7702e8744',
            availabilityZones: ['us-east-1a', 'us-east-1b'],
            privateSubnetIds: ['subnet-009ab6b021d6e8977', 'subnet-037eb54265d07da73'],
            vpcCidrBlock: '10.18.4.0/22'
        });
        const vpcSubnets = {
            subnets: vpc.privateSubnets
        };
        // Reference existing Security Group for Oracle database access
        const databaseSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'ExistingLambdaSg', 'sg-0f46b023f56e5bde4');
        // Lambda: Test Oracle (Node.js Docker Container) - Using Docker container with Oracle Instant Client
        const testOracleNodejsLambda = new lambda.DockerImageFunction(this, 'TestOracleNodejsLambda-p', {
            functionName: generateResourceName('lambda_test_oracle_nodejs-p'),
            code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, 'lambdas/test-oracle-nodejs-container-per'), {
                platform: aws_ecr_assets_1.Platform.LINUX_AMD64,
            }),
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            vpc: vpc,
            vpcSubnets: vpcSubnets,
            securityGroups: [databaseSecurityGroup],
            environment: {
                STAGE: stage,
                PROJECT: project,
                CLIENT: client,
                USE_CASE: useCase,
                FUNCTION_NAME: 'test_oracle_nodejs',
                // Variables de Oracle Database (desde .env)
                DB_TYPE: process.env.DB_TYPE || 'oracle',
                DB_HOST: process.env.DB_HOST || 'coyan.aduana.cl',
                DB_PORT: process.env.DB_PORT || '1522',
                DB_USERNAME: process.env.DB_USERNAME || 'UD_EPADILLA_ARKHO',
                DB_PASSWORD: process.env.DB_PASSWORD || 'fod#1025',
                DB_NAME: process.env.DB_NAME || process.env.DB_SID || 'aries',
                DB_SCHEMA: process.env.DB_SCHEMA || 'FISCALIZACIONES',
                // Configuración de Oracle Instant Client (ya configurado en Dockerfile)
                ORACLE_CLIENT_LIB_DIR: '/opt/oracle/instantclient_19_3',
                LD_LIBRARY_PATH: '/opt/oracle/instantclient_19_3',
                NODE_ENV: 'production'
            },
            description: `Lambda test-oracle (Node.js Docker) for ${project}-${client}-${useCase} in ${stage}`,
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        this.lambdas['test-oracle-nodejs'] = testOracleNodejsLambda;
        // ========================================
        // API Gateway REST API
        // ========================================
        const apiName = generateResourceName('api');
        this.api = new apigateway.RestApi(this, 'FiscalizacionApiGateway', {
            restApiName: apiName,
            description: `API Gateway for ${project}-${client}-${useCase} in ${stage} environment`,
            deployOptions: {
                stageName: stage,
                loggingLevel: apigateway.MethodLoggingLevel.OFF,
                dataTraceEnabled: false,
                metricsEnabled: true,
                tracingEnabled: false,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token'
                ],
            },
        });
        // ========================================
        // Rutas del API Gateway - Una ruta por cada Lambda
        // ========================================
        // Ruta /api/{proxy+} -> Captura todas las rutas de la API de NestJS incluyendo Swagger
        const testOracleIntegration = new apigateway.LambdaIntegration(testOracleNodejsLambda, {
            proxy: true,
        });
        this.api.root.addMethod('ANY', testOracleIntegration);
        const rootProxyResource = this.api.root.addResource('{proxy+}');
        rootProxyResource.addMethod('ANY', testOracleIntegration);
        // Ruta /api/fiscalizacion -> Endpoints de fiscalización
        const apiFiscalizacionResource = this.api.root.addResource('api').addResource('fiscalizacion');
        apiFiscalizacionResource.addResource('preparar-registro-multiple').addMethod('POST', testOracleIntegration);
        apiFiscalizacionResource.addResource('preparar-registro-individual').addMethod('POST', testOracleIntegration);
        apiFiscalizacionResource.addResource('aplicar-registro').addMethod('POST', testOracleIntegration);
        // ========================================
        // Outputs - Información de todos los recursos
        // ========================================
        // API Gateway Outputs
        new cdk.CfnOutput(this, 'ApiGatewayUrl', {
            value: this.api.url,
            description: 'URL of the API Gateway',
            exportName: generateExportName('api-url'),
        });
        new cdk.CfnOutput(this, 'ApiGatewayId', {
            value: this.api.restApiId,
            description: 'ID of the API Gateway',
            exportName: generateExportName('api-id'),
        });
        // Lambda Outputs - Test Oracle (Node.js Docker)
        new cdk.CfnOutput(this, 'TestOracleNodejsLambdaName', {
            value: testOracleNodejsLambda.functionName,
            description: 'Name of the Test Oracle Lambda function (Node.js Docker)',
            exportName: generateExportName('lambda-test-oracle-nodejs-name'),
        });
        new cdk.CfnOutput(this, 'TestOracleNodejsLambdaArn', {
            value: testOracleNodejsLambda.functionArn,
            description: 'ARN of the Test Oracle Lambda function (Node.js Docker)',
            exportName: generateExportName('lambda-test-oracle-nodejs-arn'),
        });
        // Configuration Outputs
        new cdk.CfnOutput(this, 'Project', {
            value: project,
            description: 'Project name',
            exportName: generateExportName('project'),
        });
        new cdk.CfnOutput(this, 'Client', {
            value: client,
            description: 'Client name',
            exportName: generateExportName('client'),
        });
        new cdk.CfnOutput(this, 'UseCase', {
            value: useCase,
            description: 'Use case prefix',
            exportName: generateExportName('usecase'),
        });
        new cdk.CfnOutput(this, 'Stage', {
            value: stage,
            description: 'Deployment stage',
            exportName: generateExportName('stage'),
        });
        // ========================================
        // Tags para todos los recursos
        // ========================================
        cdk.Tags.of(this).add('Project', project);
        cdk.Tags.of(this).add('Client', client);
        cdk.Tags.of(this).add('UseCase', useCase);
        cdk.Tags.of(this).add('Stage', stage);
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
    }
}
exports.FiscalizacionStack = FiscalizacionStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsK0RBQWlEO0FBQ2pELHVFQUF5RDtBQUN6RCwyREFBNkM7QUFDN0MsMkNBQTZCO0FBQzdCLHlEQUEyQztBQUUzQywrREFBc0Q7QUFZdEQ7Ozs7R0FJRztBQUNILE1BQWEsa0JBQW1CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFLL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUErQjtRQUN2RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUwxQixtREFBbUQ7UUFDbkMsWUFBTyxHQUF1QyxFQUFFLENBQUM7UUFNL0QsTUFBTSxLQUFLLEdBQUcsS0FBSyxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDakMsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFDckMsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDbkMsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFFckMsNEZBQTRGO1FBQzVGLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxRQUFnQixFQUFVLEVBQUU7WUFDeEQsT0FBTyxHQUFHLE9BQU8sSUFBSSxNQUFNLElBQUksT0FBTyxJQUFJLFFBQVEsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNoRSxDQUFDLENBQUM7UUFFRixrR0FBa0c7UUFDbEcsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLFFBQWdCLEVBQVUsRUFBRTtZQUN0RCxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLE9BQU8sSUFBSSxRQUFRLElBQUksS0FBSyxP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LFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4QyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM1QyxDQUFDO0NBQ0Y7QUF2TUQsZ0RBdU1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBlY3IgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcic7XG5pbXBvcnQgeyBQbGF0Zm9ybSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3ItYXNzZXRzJztcblxuLyoqXG4gKiBQcm9waWVkYWRlcyBwYXJhIGVsIEZpc2NhbGl6YWNpb25TdGFja1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEZpc2NhbGl6YWNpb25TdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBzdGFnZT86IHN0cmluZztcbiAgcHJvamVjdD86IHN0cmluZztcbiAgY2xpZW50Pzogc3RyaW5nO1xuICB1c2VDYXNlPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFN0YWNrIGRlIEZpc2NhbGl6YWNpw7NuIGNvbiBtw7psdGlwbGVzIExhbWJkYXMgeSBBUEkgR2F0ZXdheVxuICogTm9tZW5jbGF0dXJhOiB7cHJvamVjdH1fe2NsaWVudH1fe3VzZWNhc2V9X3tyZXNvdXJjZX1fe3N0YWdlfVxuICogRWplbXBsbzogZGF0YV9sYWtlX211dF9maXNjYV9sYW1iZGFfdmVyaWZpY2FyX2RldlxuICovXG5leHBvcnQgY2xhc3MgRmlzY2FsaXphY2lvblN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgLy8gUHJvcGllZGFkZXMgcMO6YmxpY2FzIHBhcmEgYWNjZWRlciBhIGxvcyByZWN1cnNvc1xuICBwdWJsaWMgcmVhZG9ubHkgbGFtYmRhczogeyBba2V5OiBzdHJpbmddOiBsYW1iZGEuRnVuY3Rpb24gfSA9IHt9O1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBGaXNjYWxpemFjaW9uU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qgc3RhZ2UgPSBwcm9wcz8uc3RhZ2UgfHwgJyc7XG4gICAgY29uc3QgcHJvamVjdCA9IHByb3BzPy5wcm9qZWN0IHx8ICcnO1xuICAgIGNvbnN0IGNsaWVudCA9IHByb3BzPy5jbGllbnQgfHwgJyc7XG4gICAgY29uc3QgdXNlQ2FzZSA9IHByb3BzPy51c2VDYXNlIHx8ICcnO1xuXG4gICAgLy8gRnVuY2nDs24gaGVscGVyIHBhcmEgZ2VuZXJhciBub21icmVzIGNvbiBlbCBmb3JtYXRvOiBwcm9qZWN0X2NsaWVudF91c2VjYXNlX3Jlc291cmNlX3N0YWdlXG4gICAgY29uc3QgZ2VuZXJhdGVSZXNvdXJjZU5hbWUgPSAocmVzb3VyY2U6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICByZXR1cm4gYCR7cHJvamVjdH1fJHtjbGllbnR9XyR7dXNlQ2FzZX1fJHtyZXNvdXJjZX1fJHtzdGFnZX1gO1xuICAgIH07XG5cbiAgICAvLyBGdW5jacOzbiBoZWxwZXIgcGFyYSBnZW5lcmFyIG5vbWJyZXMgZGUgZXhwb3J0cyBjb21wYXRpYmxlcyBjb24gQ2xvdWRGb3JtYXRpb24gKHNpbiB1bmRlcnNjb3JlcylcbiAgICBjb25zdCBnZW5lcmF0ZUV4cG9ydE5hbWUgPSAocmVzb3VyY2U6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICByZXR1cm4gYCR7cHJvamVjdC5yZXBsYWNlKC9fL2csICctJyl9LSR7Y2xpZW50fS0ke3VzZUNhc2V9LSR7cmVzb3VyY2V9LSR7c3RhZ2V9LWZpc2NgO1xuICAgIH07XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9ucyAtIE3Dumx0aXBsZXMgbGFtYmRhcyBwYXJhIGZpc2NhbGl6YWNpw7NuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgY29uc3QgdnBjID0gZWMyLlZwYy5mcm9tVnBjQXR0cmlidXRlcyh0aGlzLCAnRXhpc3RpbmdWUEMnLCB7XG4gICAgICB2cGNJZDogJ3ZwYy0wN2FiM2FkZTc3MDJlODc0NCcsXG4gICAgICBhdmFpbGFiaWxpdHlab25lczogWyd1cy1lYXN0LTFhJywgJ3VzLWVhc3QtMWInXSxcbiAgICAgIHByaXZhdGVTdWJuZXRJZHM6IFsnc3VibmV0LTAwOWFiNmIwMjFkNmU4OTc3JywgJ3N1Ym5ldC0wMzdlYjU0MjY1ZDA3ZGE3MyddLFxuICAgICAgdnBjQ2lkckJsb2NrOiAnMTAuMTguNC4wLzIyJ1xuICAgIH0pO1xuXG5cbiAgICBjb25zdCB2cGNTdWJuZXRzID0ge1xuICAgICAgc3VibmV0czogdnBjLnByaXZhdGVTdWJuZXRzXG4gICAgfTtcblxuICAgIC8vIFJlZmVyZW5jZSBleGlzdGluZyBTZWN1cml0eSBHcm91cCBmb3IgT3JhY2xlIGRhdGFiYXNlIGFjY2Vzc1xuICAgIGNvbnN0IGRhdGFiYXNlU2VjdXJpdHlHcm91cCA9IGVjMi5TZWN1cml0eUdyb3VwLmZyb21TZWN1cml0eUdyb3VwSWQoXG4gICAgICB0aGlzLCBcbiAgICAgICdFeGlzdGluZ0xhbWJkYVNnJywgXG4gICAgICAnc2ctMGY0NmIwMjNmNTZlNWJkZTQnXG4gICAgKTtcblxuICAgIC8vIExhbWJkYTogVGVzdCBPcmFjbGUgKE5vZGUuanMgRG9ja2VyIENvbnRhaW5lcikgLSBVc2luZyBEb2NrZXIgY29udGFpbmVyIHdpdGggT3JhY2xlIEluc3RhbnQgQ2xpZW50XG4gICAgY29uc3QgdGVzdE9yYWNsZU5vZGVqc0xhbWJkYSA9IG5ldyBsYW1iZGEuRG9ja2VySW1hZ2VGdW5jdGlvbih0aGlzLCAnVGVzdE9yYWNsZU5vZGVqc0xhbWJkYS1mJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBnZW5lcmF0ZVJlc291cmNlTmFtZSgnbGFtYmRhX3Rlc3Rfb3JhY2xlX25vZGVqcy1mJyksXG4gICAgICBjb2RlOiBsYW1iZGEuRG9ja2VySW1hZ2VDb2RlLmZyb21JbWFnZUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICdsYW1iZGFzL3Rlc3Qtb3JhY2xlLW5vZGVqcy1jb250YWluZXItZmlzYycpLCB7XG4gICAgICAgIHBsYXRmb3JtOiBQbGF0Zm9ybS5MSU5VWF9BTUQ2NCxcbiAgICAgIH0pLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgIHZwYzogdnBjLFxuICAgICAgdnBjU3VibmV0czogdnBjU3VibmV0cyxcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbZGF0YWJhc2VTZWN1cml0eUdyb3VwXSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFNUQUdFOiBzdGFnZSxcbiAgICAgICAgUFJPSkVDVDogcHJvamVjdCxcbiAgICAgICAgQ0xJRU5UOiBjbGllbnQsXG4gICAgICAgIFVTRV9DQVNFOiB1c2VDYXNlLFxuICAgICAgICBGVU5DVElPTl9OQU1FOiAndGVzdF9vcmFjbGVfbm9kZWpzJyxcbiAgICAgICAgLy8gVmFyaWFibGVzIGRlIE9yYWNsZSBEYXRhYmFzZSAoZGVzZGUgLmVudilcbiAgICAgICAgREJfVFlQRTogcHJvY2Vzcy5lbnYuREJfVFlQRSB8fCAnb3JhY2xlJyxcbiAgICAgICAgREJfSE9TVDogcHJvY2Vzcy5lbnYuREJfSE9TVCB8fCAnY295YW4uYWR1YW5hLmNsJyxcbiAgICAgICAgREJfUE9SVDogcHJvY2Vzcy5lbnYuREJfUE9SVCB8fCAnMTUyMicsXG4gICAgICAgIERCX1VTRVJOQU1FOiBwcm9jZXNzLmVudi5EQl9VU0VSTkFNRSB8fCAnVURfRVBBRElMTEFfQVJLSE8nLFxuICAgICAgICBEQl9QQVNTV09SRDogcHJvY2Vzcy5lbnYuREJfUEFTU1dPUkQgfHwgJ2ZvZCMxMDI1JyxcbiAgICAgICAgREJfTkFNRTogcHJvY2Vzcy5lbnYuREJfTkFNRSB8fCBwcm9jZXNzLmVudi5EQl9TSUQgfHwgJ2FyaWVzJyxcbiAgICAgICAgREJfU0NIRU1BOiBwcm9jZXNzLmVudi5EQl9TQ0hFTUEgfHwgJ0ZJU0NBTElaQUNJT05FUycsXG4gICAgICAgIC8vIENvbmZpZ3VyYWNpw7NuIGRlIE9yYWNsZSBJbnN0YW50IENsaWVudCAoeWEgY29uZmlndXJhZG8gZW4gRG9ja2VyZmlsZSlcbiAgICAgICAgT1JBQ0xFX0NMSUVOVF9MSUJfRElSOiAnL29wdC9vcmFjbGUvaW5zdGFudGNsaWVudF8xOV8zJyxcbiAgICAgICAgTERfTElCUkFSWV9QQVRIOiAnL29wdC9vcmFjbGUvaW5zdGFudGNsaWVudF8xOV8zJyxcbiAgICAgICAgTk9ERV9FTlY6ICdwcm9kdWN0aW9uJ1xuICAgICAgfSxcbiAgICAgIGRlc2NyaXB0aW9uOiBgTGFtYmRhIHRlc3Qtb3JhY2xlIChOb2RlLmpzIERvY2tlcikgZm9yICR7cHJvamVjdH0tJHtjbGllbnR9LSR7dXNlQ2FzZX0gaW4gJHtzdGFnZX1gLFxuICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgfSk7XG4gICAgdGhpcy5sYW1iZGFzWyd0ZXN0LW9yYWNsZS1ub2RlanMnXSA9IHRlc3RPcmFjbGVOb2RlanNMYW1iZGE7XG5cbiAgICBcblxuICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIEFQSSBHYXRld2F5IFJFU1QgQVBJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IGFwaU5hbWUgPSBnZW5lcmF0ZVJlc291cmNlTmFtZSgnYXBpJyk7XG4gICAgdGhpcy5hcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdGaXNjYWxpemFjaW9uQXBpR2F0ZXdheScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBhcGlOYW1lLFxuICAgICAgZGVzY3JpcHRpb246IGBBUEkgR2F0ZXdheSBmb3IgJHtwcm9qZWN0fS0ke2NsaWVudH0tJHt1c2VDYXNlfSBpbiAke3N0YWdlfSBlbnZpcm9ubWVudGAsXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XG4gICAgICAgIHN0YWdlTmFtZTogc3RhZ2UsXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuT0ZGLFxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiBmYWxzZSxcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIHRyYWNpbmdFbmFibGVkOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJyxcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nLFxuICAgICAgICAgICdYLUFwaS1LZXknLFxuICAgICAgICAgICdYLUFtei1TZWN1cml0eS1Ub2tlbidcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gUnV0YXMgZGVsIEFQSSBHYXRld2F5IC0gVW5hIHJ1dGEgcG9yIGNhZGEgTGFtYmRhXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cblxuICAgIC8vIFJ1dGEgL2FwaS97cHJveHkrfSAtPiBDYXB0dXJhIHRvZGFzIGxhcyBydXRhcyBkZSBsYSBBUEkgZGUgTmVzdEpTIGluY2x1eWVuZG8gU3dhZ2dlclxuICAgIGNvbnN0IHRlc3RPcmFjbGVJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRlc3RPcmFjbGVOb2RlanNMYW1iZGEsIHtcbiAgICAgIHByb3h5OiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuYXBpLnJvb3QuYWRkTWV0aG9kKCdBTlknLCB0ZXN0T3JhY2xlSW50ZWdyYXRpb24pO1xuICAgIGNvbnN0IHJvb3RQcm94eVJlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgne3Byb3h5K30nKTtcbiAgICByb290UHJveHlSZXNvdXJjZS5hZGRNZXRob2QoJ0FOWScsIHRlc3RPcmFjbGVJbnRlZ3JhdGlvbik7XG5cbiAgICAvLyBSdXRhIC9hcGkvZmlzY2FsaXphY2lvbiAtPiBFbmRwb2ludHMgZGUgZmlzY2FsaXphY2nDs25cbiAgICBjb25zdCBhcGlGaXNjYWxpemFjaW9uUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdhcGknKS5hZGRSZXNvdXJjZSgnZmlzY2FsaXphY2lvbicpO1xuICAgIGFwaUZpc2NhbGl6YWNpb25SZXNvdXJjZS5hZGRSZXNvdXJjZSgncHJlcGFyYXItcmVnaXN0cm8tbXVsdGlwbGUnKS5hZGRNZXRob2QoJ1BPU1QnLCB0ZXN0T3JhY2xlSW50ZWdyYXRpb24pO1xuICAgIGFwaUZpc2NhbGl6YWNpb25SZXNvdXJjZS5hZGRSZXNvdXJjZSgncHJlcGFyYXItcmVnaXN0cm8taW5kaXZpZHVhbCcpLmFkZE1ldGhvZCgnUE9TVCcsIHRlc3RPcmFjbGVJbnRlZ3JhdGlvbik7XG4gICAgYXBpRmlzY2FsaXphY2lvblJlc291cmNlLmFkZFJlc291cmNlKCdhcGxpY2FyLXJlZ2lzdHJvJykuYWRkTWV0aG9kKCdQT1NUJywgdGVzdE9yYWNsZUludGVncmF0aW9uKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBPdXRwdXRzIC0gSW5mb3JtYWNpw7NuIGRlIHRvZG9zIGxvcyByZWN1cnNvc1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8vIEFQSSBHYXRld2F5IE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpR2F0ZXdheVVybCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ1VSTCBvZiB0aGUgQVBJIEdhdGV3YXknLFxuICAgICAgZXhwb3J0TmFtZTogZ2VuZXJhdGVFeHBvcnROYW1lKCdhcGktdXJsJyksXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpR2F0ZXdheUlkJywge1xuICAgICAgdmFsdWU6IHRoaXMuYXBpLnJlc3RBcGlJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSUQgb2YgdGhlIEFQSSBHYXRld2F5JyxcbiAgICAgIGV4cG9ydE5hbWU6IGdlbmVyYXRlRXhwb3J0TmFtZSgnYXBpLWlkJyksXG4gICAgfSk7XG5cbiBcblxuICAgIC8vIExhbWJkYSBPdXRwdXRzIC0gVGVzdCBPcmFjbGUgKE5vZGUuanMgRG9ja2VyKVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdUZXN0T3JhY2xlTm9kZWpzTGFtYmRhTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0ZXN0T3JhY2xlTm9kZWpzTGFtYmRhLmZ1bmN0aW9uTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgVGVzdCBPcmFjbGUgTGFtYmRhIGZ1bmN0aW9uIChOb2RlLmpzIERvY2tlciknLFxuICAgICAgZXhwb3J0TmFtZTogZ2VuZXJhdGVFeHBvcnROYW1lKCdsYW1iZGEtdGVzdC1vcmFjbGUtbm9kZWpzLW5hbWUnKSxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdUZXN0T3JhY2xlTm9kZWpzTGFtYmRhQXJuJywge1xuICAgICAgdmFsdWU6IHRlc3RPcmFjbGVOb2RlanNMYW1iZGEuZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0FSTiBvZiB0aGUgVGVzdCBPcmFjbGUgTGFtYmRhIGZ1bmN0aW9uIChOb2RlLmpzIERvY2tlciknLFxuICAgICAgZXhwb3J0TmFtZTogZ2VuZXJhdGVFeHBvcnROYW1lKCdsYW1iZGEtdGVzdC1vcmFjbGUtbm9kZWpzLWFybicpLFxuICAgIH0pO1xuXG4gIFxuXG4gICAgLy8gQ29uZmlndXJhdGlvbiBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1Byb2plY3QnLCB7XG4gICAgICB2YWx1ZTogcHJvamVjdCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUHJvamVjdCBuYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGdlbmVyYXRlRXhwb3J0TmFtZSgncHJvamVjdCcpLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NsaWVudCcsIHtcbiAgICAgIHZhbHVlOiBjbGllbnQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NsaWVudCBuYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGdlbmVyYXRlRXhwb3J0TmFtZSgnY2xpZW50JyksXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlQ2FzZScsIHtcbiAgICAgIHZhbHVlOiB1c2VDYXNlLFxuICAgICAgZGVzY3JpcHRpb246ICdVc2UgY2FzZSBwcmVmaXgnLFxuICAgICAgZXhwb3J0TmFtZTogZ2VuZXJhdGVFeHBvcnROYW1lKCd1c2VjYXNlJyksXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3RhZ2UnLCB7XG4gICAgICB2YWx1ZTogc3RhZ2UsXG4gICAgICBkZXNjcmlwdGlvbjogJ0RlcGxveW1lbnQgc3RhZ2UnLFxuICAgICAgZXhwb3J0TmFtZTogZ2VuZXJhdGVFeHBvcnROYW1lKCdzdGFnZScpLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFRhZ3MgcGFyYSB0b2RvcyBsb3MgcmVjdXJzb3NcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdQcm9qZWN0JywgcHJvamVjdCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDbGllbnQnLCBjbGllbnQpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnVXNlQ2FzZScsIHVzZUNhc2UpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3RhZ2UnLCBzdGFnZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XG4gIH1cbn1cbiJdfQ==