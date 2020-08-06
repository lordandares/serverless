import { errors, schemas } from '@lighthouse/serverless-common'
import { Context, SNSEvent } from 'aws-lambda'
import { DynamoDB, SNS, StepFunctions } from 'aws-sdk'
import { DocumentClient as DC } from 'aws-sdk/clients/dynamodb'

import {
  OCCURRENCE_STATUS_ACTIVE,
  OCCURRENCE_STATUS_EXPIRED,
} from '../constants'
import parseSnsEvent from './lib/parseSnsEvent'

declare var process: {
  env: {
    CREATE_EXCEPTION_ARN: string
    ENSURE_OCCURRENCES_STEP_FUNCTION: string
    TABLE_SCHEDULES: string
  }
}

export async function occurrenceExpiredHandler(
  event: SNSEvent,
  context: Context,
): Promise<void> {
  try {
    const { body } = parseSnsEvent(event)

    if (!body) {
      throw new errors.ApplicationError({
        message: 'occurrenceExpiredHandler: missing body on event',
      })
    }

    const { pk: occurrencePk, sk: occurrenceSk } = body
    const { awsRequestId, invokedFunctionArn } = context

    const documentClient = new DynamoDB.DocumentClient()
    const sfs = new StepFunctions()
    const snsClient = new SNS()
    const tableName = process.env.TABLE_SCHEDULES

    const occurrenceGetParams: DC.GetItemInput = {
      Key: { pk: occurrencePk, sk: occurrenceSk },
      TableName: tableName,
    }

    const occurrenceGetResponse: DC.GetItemOutput = await documentClient
      .get(occurrenceGetParams)
      .promise()

    const { Item: occurrenceDocument } = occurrenceGetResponse

    if (!occurrenceDocument) {
      throw new errors.ResourceNotFoundError({
        id: JSON.stringify({ pk: occurrencePk, sk: occurrenceSk }),
        resource: 'occurrence',
      })
    }

    console.debug('OccurrenceExpiredHandler: setting occurrence to expired', {
      occurrence: JSON.stringify(occurrenceDocument),
    })

    const {
      occurrenceId,
      status,
    } = occurrenceDocument as schemas.ScheduleOccurrenceDocumentSchema

    if (status !== OCCURRENCE_STATUS_ACTIVE) {
      console.info(
        `OccurrenceExpiredHandler: occurrence is no longer active and has ${status} status so skipping`,
        {
          occurrenceId,
        },
      )

      return
    }

    const timestamp = new Date().toISOString()

    const updateParams: DC.UpdateItemInput = {
      AttributeUpdates: {
        expiredAt: {
          Action: 'PUT',
          Value: timestamp,
        },
        expiredBy: {
          Action: 'PUT',
          Value: invokedFunctionArn,
        },
        status: {
          Action: 'PUT',
          Value: OCCURRENCE_STATUS_EXPIRED,
        },
        updatedAt: {
          Action: 'PUT',
          Value: timestamp,
        },
        updatedBy: {
          Action: 'PUT',
          Value: {
            id: awsRequestId,
            label: invokedFunctionArn,
            type: 'system',
          },
        },
      },
      Key: {
        pk: occurrencePk,
        sk: occurrenceSk,
      },
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
    }

    console.info('OccurrenceExpiredHandler: updating occurrence status')

    const occurrenceUpdateResponse: DC.UpdateItemOutput = await documentClient
      .update(updateParams)
      .promise()

    console.info('OccurrenceExpiredHandler: set occurrence status to expired')

    const { Attributes: updatedOccurrenceDocument } = occurrenceUpdateResponse

    console.info(
      `OccurrenceExpiredHandler: sending message to ARN: ${
        process.env.CREATE_EXCEPTION_ARN
      }`,
    )

    const snsResponse = await snsClient
      .publish({
        Message: JSON.stringify(updatedOccurrenceDocument),
        TopicArn: process.env.CREATE_EXCEPTION_ARN,
      })
      .promise()

    console.info('OccurrenceExpiredHandler: sent message to sns', {
      snsResponse: JSON.stringify(snsResponse),
    })

    const {
      applicationId,
      scheduleId,
    } = updatedOccurrenceDocument as schemas.ScheduleOccurrenceDocumentSchema

    console.debug('OccurrenceExpiredHandler: invoking step function', {
      scheduleId,
      stateMachineArn: process.env.ENSURE_OCCURRENCES_STEP_FUNCTION,
    })

    await sfs
      .startExecution({
        input: JSON.stringify({ scheduleId }),
        name: `${applicationId}-${scheduleId}-${Date.now()}`,
        stateMachineArn: process.env.ENSURE_OCCURRENCES_STEP_FUNCTION,
      })
      .promise()
  } catch (err) {
    console.error('OccurrenceExpiredHandlerError', {
      err,
      event: JSON.stringify(event),
    })

    if (errors.isKnownError(err)) {
      throw err
    }

    throw new errors.UnknownError()
  }
}
