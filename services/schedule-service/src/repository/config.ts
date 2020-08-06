import { ClientConfiguration } from 'aws-sdk/clients/dynamodb'

export function getDynamoDbConfig(region: string): ClientConfiguration {
  return region === 'localhost'
    ? {
        endpoint: 'http://localhost:8000',
        httpOptions: {
          timeout: 5000,
        },
        region: process.env.REGION,
      }
    : {}
}
