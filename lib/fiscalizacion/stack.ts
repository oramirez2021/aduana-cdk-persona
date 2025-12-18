import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';

/**
 * Propiedades para el FiscalizacionStack
 */
export interface FiscalizacionStackProps extends cdk.StackProps {
  stage?: string;
  project?: string;
  client?: string;
  useCase?: string;
}

/**
 * Stack de Fiscalización con múltiples Lambdas y API Gateway
 * Nomenclatura: {project}_{client}_{usecase}_{resource}_{stage}
 * Ejemplo: data_lake_mut_fisca_lambda_verificar_dev
 */
export class FiscalizacionStack extends cdk.Stack {
  // Propiedades públicas para acceder a los recursos
  public readonly lambdas: { [key: string]: lambda.Function } = {};
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: FiscalizacionStackProps) {
    super(scope, id, props);

    const stage = props?.stage || '';
    const project = props?.project || '';
    const client = props?.client || '';
    const useCase = props?.useCase || '';

    // Función helper para generar nombres con el formato: project_client_usecase_resource_stage
    const generateResourceName = (resource: string): string => {
      return `${project}_${client}_${useCase}_${resource}_${stage}`;
    };

    // Función helper para generar nombres de exports compatibles con CloudFormation (sin underscores)
    const generateExportName = (resource: string): string => {
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
    const databaseSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this, 
      'ExistingLambdaSg', 
      'sg-0f46b023f56e5bde4'
    );

    // Lambda: Test Oracle (Node.js Docker Container) - Using Docker container with Oracle Instant Client
    const testOracleNodejsLambda = new lambda.DockerImageFunction(this, 'TestOracleNodejsLambda-p', {
      functionName: generateResourceName('lambda_test_oracle_nodejs-p'),
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, 'lambdas/test-oracle-nodejs-container-per'), {
        platform: Platform.LINUX_AMD64,
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
      description: `API Gateway for ${project}-${client}-${useCase} in ${stage} environment PERSONA`,
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

    const testOracleIntegration = new apigateway.LambdaIntegration(testOracleNodejsLambda, {
      proxy: true,
    });

    // Ruta /api/{proxy+} -> Captura todas las rutas de la API de NestJS incluyendo Swagger
    this.api.root.addMethod('ANY', testOracleIntegration);
    const rootProxyResource = this.api.root.addResource('{proxy+}');
    rootProxyResource.addMethod('ANY', testOracleIntegration);

    // ========================================
    // Endpoints específicos encontrados en el código fuente
    // ========================================

    // API Resource para endpoints bajo /api
    const apiResource = this.api.root.addResource('api');
    
    // Health Check: GET /api/health
    apiResource.addResource('health').addMethod('GET', testOracleIntegration);

    // Swagger Documentation: GET /api/docs y recursos estáticos
    const docsResource = apiResource.addResource('docs');
    docsResource.addMethod('GET', testOracleIntegration);
    const docsProxy = docsResource.addResource('{proxy+}');
    docsProxy.addMethod('ANY', testOracleIntegration);

    // Personas endpoints: GET /personas
    const personasResource = this.api.root.addResource('personas');
    personasResource.addMethod('GET', testOracleIntegration);

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
