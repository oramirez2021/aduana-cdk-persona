import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
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
export declare class FiscalizacionStack extends cdk.Stack {
    readonly lambdas: {
        [key: string]: lambda.Function;
    };
    readonly api: apigateway.RestApi;
    constructor(scope: Construct, id: string, props?: FiscalizacionStackProps);
}
