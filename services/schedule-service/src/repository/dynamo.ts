import { errors, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk'
import {
  ClientConfiguration,
  DocumentClient as DC,
  ItemList,
} from 'aws-sdk/clients/dynamodb'
import * as AWSXRay from 'aws-xray-sdk'
import { isEmpty, join, map } from 'lodash'

import { getDynamoDbConfig } from './config'

declare var process: {
  env: {
    IS_OFFLINE: string
    REGION: string
  }
}

type Document = {
  pk: string
  sk: string
} & {
  [key: string]: any
}

export function getDocumentClient(): DC {
  const dynamoDbConfig: ClientConfiguration = getDynamoDbConfig(
    process.env.REGION,
  )

  const DynamoDB = process.env.IS_OFFLINE
    ? AWS.DynamoDB
    : /* istanbul ignore next */
      AWSXRay.captureAWS(AWS).DynamoDB

  return new DynamoDB.DocumentClient(dynamoDbConfig)
}

export function DynamoRepository(tableName: string) {
  const get = async ({
    pk,
    sk,
  }: {
    pk: string
    sk: string
  }): Promise<Document> => {
    const documentClient = getDocumentClient()

    const dynamoQuery: DC.GetItemInput = {
      Key: { pk, sk },
      TableName: tableName,
    }

    try {
      const response: DC.GetItemOutput = await documentClient
        .get(dynamoQuery)
        .promise()

      return response.Item! as Document
    } catch (err) {
      throw new errors.ApplicationError({ message: err.message })
    }
  }

  interface GetByScheduleOptions {
    groupType?: string
    limit?: number
    scheduleId: string
    status?: string
  }

  const getBySchedule = async ({
    groupType,
    limit,
    scheduleId,
    status,
  }: GetByScheduleOptions): Promise<ItemList> => {
    const documentClient = getDocumentClient()

    const dynamoQuery: DC.QueryInput = {
      ExpressionAttributeNames: {
        '#scheduleId': 'scheduleId',
      },
      ExpressionAttributeValues: {
        ':scheduleId': scheduleId,
      },
      IndexName: 'ScheduleIdIndex',
      KeyConditionExpression: '#scheduleId = :scheduleId',
      TableName: tableName,
    }

    const filterExpressions: string[] = []

    /* istanbul ignore next */
    if (
      groupType &&
      dynamoQuery.ExpressionAttributeNames &&
      dynamoQuery.ExpressionAttributeValues
    ) {
      dynamoQuery.ExpressionAttributeNames['#groupType'] = 'groupType'
      dynamoQuery.ExpressionAttributeValues[':groupType'] = groupType
      filterExpressions.push('#groupType = :groupType')
    }

    /* istanbul ignore next */
    if (
      status &&
      dynamoQuery.ExpressionAttributeNames &&
      dynamoQuery.ExpressionAttributeValues
    ) {
      dynamoQuery.ExpressionAttributeNames['#status'] = 'status'
      dynamoQuery.ExpressionAttributeValues[':status'] = status
      filterExpressions.push('#status = :status')
    }

    if (limit) {
      dynamoQuery.Limit = limit
    }

    if (!isEmpty(filterExpressions)) {
      const filterExpressionsString = join(filterExpressions, ' AND ')
      dynamoQuery.FilterExpression = filterExpressionsString
    }

    try {
      const response: DC.QueryOutput = await documentClient
        .query(dynamoQuery)
        .promise()

      return response.Items!
    } catch (err) {
      throw new errors.ApplicationError({ message: err.message })
    }
  }

  const listSchedules = async (applicationId: string): Promise<ItemList> => {
    const documentClient = getDocumentClient()

    const dynamoQuery: DC.QueryInput = {
      ExpressionAttributeValues: {
        ':groupType': 'schedule',
        ':pk': `${applicationId}-schedule`,
      },
      FilterExpression: 'groupType = :groupType',
      KeyConditionExpression: 'pk = :pk',
      ScanIndexForward: false,
      TableName: tableName,
    }

    try {
      const response: DC.QueryOutput = await documentClient
        .query(dynamoQuery)
        .promise()

      return response.Items!
    } catch (err) {
      throw new errors.ApplicationError({ message: err.message })
    }
  }

  const put = async entity => {
    try {
      const documentClient = getDocumentClient()
      const dynamoItem: DC.PutItemInput = {
        Item: entity,
        TableName: tableName,
      }
      await documentClient.put(dynamoItem).promise()
      return entity
    } catch (err) {
      throw new errors.ApplicationError({ message: err.message })
    }
  }

  const remove = async (
    items: Document[],
  ): Promise<DC.TransactWriteItemsOutput | []> => {
    const documentClient = getDocumentClient()
    try {
      if (!items || items.length === 0) {
        return []
      }

      const transactParams: DC.TransactWriteItemsInput = {
        TransactItems: items.map(item => ({
          Delete: {
            Key: {
              pk: item.pk,
              sk: item.sk,
            },
            TableName: tableName,
          },
        })),
      }

      const response = await documentClient
        .transactWrite(transactParams)
        .promise()

      return response
    } catch (err) {
      throw new errors.ApplicationError({ message: err.message })
    }
  }

  return {
    get,
    getBySchedule,
    listSchedules,
    put,
    remove,
  }
}
