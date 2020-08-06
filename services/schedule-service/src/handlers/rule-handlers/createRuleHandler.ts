import { errors, schemas } from '@lighthouse/serverless-common'
import { Context } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import { ClientConfiguration, DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWSXRay from 'aws-xray-sdk'
import * as moment from 'moment'

import { OCCURRENCE_STATUS_ACTIVE } from '../../constants'
import { payloadToRulePatternDocument } from '../../service/lib/ruleTransform'

declare var process: {
  env: {
    IS_OFFLINE: string
    REGION: string
    OCCURRENCE_ACTIVE_ARN: string
    TABLE_SCHEDULES: string
  }
}

export async function createRuleHandler(body: any, context: Context) {
  try {
    const { awsRequestId: arnId, invokedFunctionArn: arn } = context

    if (!body) {
      throw new errors.ApplicationError({
        message: `A rule body is required`,
      })
    }

    await schemas.validate({
      data: body,
      schema: schemas.rulePayloadSchema,
    })

    console.info('CreateRuleHandler: body', { body })

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

    const {
      applicationId,
      locationId,
      occurrenceId,
      pk: occurrencePk,
      scheduleId,
      startAt: startAtIsoString,
      sk: occurrenceSk,
    } = body

    const nowIsoString = new Date().toISOString()
    const isStartInFuture = startAtIsoString > nowIsoString

    // NOTE: if the start is in the future we prevent the rule from being created
    // until one minute before the occurrence is due to start
    if (isStartInFuture) {
      console.info(
        'CreateRuleHandler: occurrence is in the future so creating timer',
        {
          nowIsoString,
          startAtIsoString,
        },
      )

      const mNow = moment(new Date(startAtIsoString))

      const timerTriggersAt = mNow.utc().subtract(1, 'minute')
      const timerTriggersAtMin = timerTriggersAt.format('YYYY-MM-DDTHH:mm')

      const timerExpiresAt = mNow
        .add(1, 'day')
        .toDate()
        .toISOString()

      const timerDocument: schemas.TimerDocumentSchema = {
        expiresAt: timerExpiresAt,
        groupType: 'occurrence-timer',
        pk: `timer-${timerTriggersAtMin}`,
        scheduleId,
        sk: `timer#${occurrencePk}#${occurrenceSk}`,
        targetArn: process.env.OCCURRENCE_ACTIVE_ARN,
      }

      await schemas.validate({
        data: timerDocument,
        schema: schemas.timerDocumentSchema,
      })

      const putTimerParams: DocumentClient.PutItemInput = {
        Item: timerDocument,
        TableName: tableName,
      }

      console.info('CreateRuleHandler: creating timer', {
        timerDocument,
      })

      await documentClient.put(putTimerParams).promise()

      console.info('CreateRuleHandler: created timer')

      return
    }

    const pk = `rule-pattern-${applicationId}-${locationId}`
    const sk = 'visit'

    const rulePatternGetParams: DocumentClient.GetItemInput = {
      Key: { pk, sk },
      TableName: tableName,
    }

    const rulePatternGetResponse: DocumentClient.GetItemOutput = await documentClient
      .get(rulePatternGetParams)
      .promise()

    const { Item: rulePatternDocument } = rulePatternGetResponse

    const actor: schemas.ActorSchema = {
      id: arnId,
      label: arn,
      type: 'system',
    }

    const patternDocument: schemas.RulePatternDocumentSchema = payloadToRulePatternDocument(
      {
        actor,
        existingDocument: rulePatternDocument as schemas.RulePatternDocumentSchema,
        payload: body,
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

    const occurrenceGetParams: DocumentClient.GetItemInput = {
      Key: { pk: occurrencePk, sk: occurrenceSk },
      TableName: tableName,
    }

    const occurrenceGetResponse: DocumentClient.GetItemOutput = await documentClient
      .get(occurrenceGetParams)
      .promise()

    const { Item: occurrenceDocument } = occurrenceGetResponse

    if (!occurrenceDocument) {
      throw new errors.ApplicationError({
        message: `The occurrence is missing so unable to add rule or set occurrence to active`,
      })
    }

    const transactItems: DocumentClient.TransactWriteItemList = []

    const updatedAtIsoString = new Date().toISOString()

    // update or add new rule pattern document
    if (rulePatternDocument) {
      console.info(
        'CreateRuleHandler: updating existing rule pattern document',
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
            ':expectedUpdatedAt': rulePatternDocument.updatedAt,
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
    } else {
      console.info('CreateRuleHandler: adding new rule pattern document', {
        patternDocument,
      })

      transactItems.push({
        Put: {
          Item: patternDocument,
          TableName: tableName,
        },
      })
    }

    console.info('CreateRuleHandler: updating existing occurrence', {
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
        `CreateRuleHandler: processing ${transactItemsLength} transactions`,
      )

      await documentClient.transactWrite(transactParams).promise()

      console.info('CreateRuleHandler: completed transactions successfully')
    } catch (err) {
      throw new errors.ApplicationError({ message: err.message })
    }
  } catch (err) {
    console.error('CreateRuleHandlerError', {
      body,
      err,
    })

    throw err
  }
}
