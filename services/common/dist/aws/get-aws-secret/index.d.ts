import AWS from 'aws-sdk';
export declare function getAwsSecret(secretId: string, secretKey?: string): Promise<any>;
export declare function parseSecretString(payload: AWS.SecretsManager.GetSecretValueResponse): any;
