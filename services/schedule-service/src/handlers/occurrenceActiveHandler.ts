import { errors, schemas } from '@lighthouse/serverless-common'
import { Context, SNSEvent } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import { ClientConfiguration, DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWSXRay from 'aws-xray-sdk'
import * as moment from 'moment'

import { OCCURRENCE_STATUS_ACTIVE } from '../constants'

import { payloadToRulePatternDocument } from '../service/lib/ruleTransform'
import parseSnsEvent from './lib/parseSnsEvent'

declare var process: {
  env: {
    IS_OFFLINE: string
    REGION: string
    TABLE_SCHEDULES: string
  }
}

export async function occurrenceActiveHandler(
  event: SNSEvent,
  context: Context,
) {
  try {
    const { body } = parseSnsEvent(event)

    if (!body) {
      throw new errors.ApplicationError({
        message: 'occurrenceActiveHandler: missing body on event',
      })
    }

    const { pk: occurrencePk, sk: occurrenceSk } = body
    const { awsRequestId, invokedFunctionArn } = context

    const isOffline = process.env.IS_OFFLINE
    const region = process.env.REGION
    const tableName = process.env.TABLE_SCHEDULES

    const dynamoDbConfig: ClientConfiguration =
      region === 'localhost'
        ? /* istanbul ignore next */ {
            endpoint: 'http://localhost:8000',
            httpOptions: { timeout: 5000 },
            region,
          }
        : {}

    const DynamoDB = isOffline
      ? AWS.DynamoDB
      : /* istanbul ignore next */
        AWSXRay.captureAWS(AWS).DynamoDB

    const documentClient: DocumentClient = new DynamoDB.DocumentClient(
      dynamoDbConfig,
    )

    const occurrenceGetParams: DocumentClient.GetItemInput = {
      Key: { pk: occurrencePk, sk: occurrenceSk },
      TableName: tableName,
    }

    const occurrenceGetResponse: DocumentClient.GetItemOutput = await documentClient
      .get(occurrenceGetParams)
      .promise()

    const { Item: occurrenceDocument } = occurrenceGetResponse

    if (!occurrenceDocument) {
      console.warn(
        'OccurrenceActiveHandler: The occurrence is missing so unable to add rule or set occurrence to active',
      )
      return
    }

    console.debug('OccurrenceActiveHandler: setting occurrence to active', {
      occurrence: JSON.stringify(occurrenceDocument),
    })

    const {
      applicationId,
      locationId,
      occurrenceId,
      status,
    } = occurrenceDocument

    if (status === OCCURRENCE_STATUS_ACTIVE) {
      console.warn(
        'OccurrenceActiveHandler: occurrence already has active status so skipping',
        {
          occurrenceId,
        },
      )
      return
    }

    const rulePk = `rule-pattern-${applicationId}-${locationId}`
    const ruleSk = 'visit'

    const rulePatternGetParams: DocumentClient.GetItemInput = {
      Key: { pk: rulePk, sk: ruleSk },
      TableName: tableName,
    }

    const rulePatternGetResponse: DocumentClient.GetItemOutput = await documentClient
      .get(rulePatternGetParams)
      .promise()

    const { Item: existingRulePattern } = rulePatternGetResponse

    const actor: schemas.ActorSchema = {
      id: awsRequestId,
      label: invokedFunctionArn,
      type: 'system',
    }

    const rulePayload = {
      applicationId,
      locationId,
      occurrenceId,
      pk: occurrencePk,
      sk: occurrenceSk,
      type: 'visit',
    }

    const patternDocument: schemas.RulePatternDocumentSchema = payloadToRulePatternDocument(
      {
        actor,
        existingDocument: existingRulePattern as schemas.RulePatternDocumentSchema,
        payload: rulePayload,
      },
    )

    try {
      await schemas.validate({
        data: patternDocument,
        schema: schemas.rulePatternDocumentSchema,
      })
    } catch (err) {
      throw new errors.ApplicationError({ message: err.message })
    }

    const transactItems: DocumentClient.TransactWriteItemList = []

    const updatedAtIsoString = moment()
      .utc()
      .toDate()
      .toISOString()

    // update or add new rule pattern document
    if (!existingRulePattern) {
      console.info(
        'OccurrenceActiveHandler: adding new rule pattern document',
        {
          patternDocument,
        },
      )

      transactItems.push({
        Put: {
          Item: patternDocument,
          TableName: tableName,
        },
      })
    } else {
      console.info(
        'OccurrenceActiveHandler: updating existing rule pattern document',
        {
          patternDocument,
        },
      )

      transactItems.push({
        Update: {
          ConditionExpression: '#updatedAt = :expectedUpdatedAt',
          ExpressionAttributeNames: {
            '#matches': 'matches',
            '#updatedAt': 'updatedAt',
            '#updatedBy': 'updatedBy',
          },
          ExpressionAttributeValues: {
            ':expectedUpdatedAt': existingRulePattern.updatedAt,
            ':matches': patternDocument.matches,
            ':nextUpdatedAt': updatedAtIsoString,
            ':updatedBy': actor,
          },
          Key: { pk: patternDocument.pk, sk: patternDocument.sk },
          TableName: tableName,
          UpdateExpression:
            'SET #matches = :matches, #updatedAt = :nextUpdatedAt, #updatedBy = :updatedBy',
        },
      })
    }

    console.info('OccurrenceActiveHandler: updating existing occurrence', {
      occurrenceDocument,
    })

    // update occurrence so status is now active
    transactItems.push({
      Update: {
        ConditionExpression: '#updatedAt = :expectedUpdatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
          '#updatedBy': 'updatedBy',
        },
        ExpressionAttributeValues: {
          ':expectedUpdatedAt': occurrenceDocument.updatedAt,
          ':nextUpdatedAt': updatedAtIsoString,
          ':status': OCCURRENCE_STATUS_ACTIVE,
          ':updatedBy': actor,
        },
        Key: { pk: occurrenceDocument.pk, sk: occurrenceDocument.sk },
        TableName: tableName,
        UpdateExpression:
          'SET #status = :status, #updatedAt = :nextUpdatedAt, #updatedBy = :updatedBy',
      },
    })

    const transactParams: DocumentClient.TransactWriteItemsInput = {
      TransactItems: transactItems,
    }

    const transactItemsLength = transactItems.length

    try {
      console.info(
        `OccurrenceActiveHandler: processing ${transactItemsLength} transactions`,
      )

      const response: DocumentClient.TransactWriteItemsOutput = await documentClient
        .transactWrite(transactParams)
        .promise()

      console.info(
        'OccurrenceActiveHandler: completed transactions successfully',
      )

      return response
    } catch (err) {
      throw new errors.ApplicationError({ message: err.message })
    }
  } catch (err) {
    console.error('OccurrenceActiveError', {
      err,
      event: JSON.stringify(event),
    })

    if (errors.isKnownError(err)) {
      throw err
    }

    throw new errors.UnknownError()
  }
}
