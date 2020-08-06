import AWS from 'aws-sdk';
export { getSecret };
declare function getSecret(secretId: string): Promise<object>;
declare function getSecret(secretId: string, secretKey: string): Promise<string>;
export declare function parseSecretString(payload: AWS.SecretsManager.GetSecretValueResponse): object;
