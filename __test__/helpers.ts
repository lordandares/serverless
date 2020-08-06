import { Context } from '@azure/functions'
import {
  APIGatewayProxyEvent,
  Context as LambdaContext,
  SNSEvent,
} from 'aws-lambda'
import { isString } from 'lodash/fp'

import { schemas } from '../services/common/src'

interface Arguments {
  body?: object
  headers?: {
    [name: string]: string
  }
  path?: string
  pathParameters?: {
    [name: string]: string
  }
}

export function createApiEvent({
  body,
  headers,
  path,
  pathParameters,
}: Arguments): APIGatewayProxyEvent {
  const bodyStr = body && JSON.stringify(body)

  const baseEvent = {
    body: null,
    headers: null,
    httpMethod: 'GET',
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    path: null,
    pathParameters: null,
    queryStringParameters: {},
    requestContext: {
      accountId: '',
      apiId: '',
      httpMethod: '',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        sourceIp: '',
        user: null,
        userAgent: null,
        userArn: null,
      },
      path: '',
      requestId: '',
      requestTimeEpoch: 0,
      resourceId: '',
      resourcePath: '',
      stage: '',
    },
    resource: 'resource',
    stageVariables: null,
  }

  return {
    ...baseEvent,
    ...(bodyStr && { body: bodyStr }),
    ...(headers && { headers }),
    ...(path && { path }),
    ...(pathParameters && { pathParameters }),
  }
}

export function createContext(): LambdaContext {
  return {
    awsRequestId: 'awsRequestId',
    callbackWaitsForEmptyEventLoop: false,
    done: () => '',
    fail: () => '',
    functionName: 'functionName',
    functionVersion: 'functionVersion',
    getRemainingTimeInMillis: () => 1000,
    invokedFunctionArn: 'invokedFunctionArn',
    logGroupName: 'logGroupName',
    logStreamName: 'logStreamName',
    memoryLimitInMB: 1000,
    succeed: () => '',
  }
}

export function createSnsEvent({ body }): SNSEvent {
  const Message = isString(body) ? body : JSON.stringify(body)

  return {
    Records: [
      {
        EventSource: 'aws:sns',
        EventSubscriptionArn: 'arn',
        EventVersion: 'v1',
        Sns: {
          Message,
          MessageAttributes: {},
          MessageId: '',
          Signature: '',
          SignatureVersion: '',
          SigningCertUrl: '',
          Subject: '',
          Timestamp: '',
          TopicArn: '',
          Type: '',
          UnsubscribeUrl: '',
        },
      },
    ],
  }
}

const azureLogger: any = message => {
  return console.info(message)
}

azureLogger.info = message => console.info(message)
azureLogger.error = message => console.error(message)
azureLogger.warn = message => console.warn(message)

export function createMockContext(): Context {
  return {
    bindings: {},
    bindingData: {},
    bindingDefinitions: [],
    done: jest.fn(),
    executionContext: {
      invocationId: '1',
      functionName: 'eventGridTrigger',
      functionDirectory: '/path/to/function',
    },
    invocationId: '1',
    log: azureLogger,
  }
}
