import { scheduling } from '@lighthouse/common'
import { errors, schemas } from '@lighthouse/serverless-common'
import { Context, SNSEvent } from 'aws-lambda'
import { DynamoDB, StepFunctions } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as BPromise from 'bluebird'
import { v4 as uuid } from 'uuid'

import {
  OCCURRENCE_STATUS_ACTIVE,
  OCCURRENCE_STATUS_RESOLVED,
} from '../constants'
import parseSnsEvent from './lib/parseSnsEvent'

declare var process: {
  env: {
    ENSURE_OCCURRENCES_STEP_FUNCTION: string
    TABLE_SCHEDULES: string
  }
}

export async function occurrenceResolvedHandler(
  event: SNSEvent,
  context,
): Promise<void> {
  try {
    const { body } = parseSnsEvent(event)

    if (!body) {
      throw new errors.ApplicationError({
        message: 'occurrenceResolvedHandler: missing body on event',
      })
    }

    const { pk: occurrencePk, sk: occurrenceSk } = body
    const { awsRequestId, invokedFunctionArn } = context

    const documentClient = new DynamoDB.DocumentClient()
    const sfs = new StepFunctions()
    const tableName = process.env.TABLE_SCHEDULES

    const occurrenceGetParams: DocumentClient.GetItemInput = {
      Key: { pk: occurrencePk, sk: occurrenceSk },
      TableName: tableName,
    }

    const occurrenceGetResponse: DocumentClient.GetItemOutput = await documentClient
      .get(occurrenceGetParams)
      .promise()

    const { Item: occurrenceDocument } = occurrenceGetResponse

    if (!occurrenceDocument) {
      throw new errors.ResourceNotFoundError({
        id: JSON.stringify({ pk: occurrencePk, sk: occurrenceSk }),
        resource: 'occurrence',
      })
    }

    console.debug('OccurrenceResolvedHandler: setting occurrence to resolved', {
      occurrence: JSON.stringify(occurrenceDocument),
    })

    const {
      occurrenceId,
      status,
    } = occurrenceDocument as schemas.ScheduleOccurrenceDocumentSchema

    if (status !== OCCURRENCE_STATUS_ACTIVE) {
      console.info(
        `OccurrenceResolvedHandler: occurrence is no longer active and has ${status} status so skipping`,
        {
          occurrenceId,
        },
      )

      return
    }

    const timestamp = new Date().toISOString()

    const updateParams: DocumentClient.UpdateItemInput = {
      AttributeUpdates: {
        status: {
          Action: 'PUT',
          Value: OCCURRENCE_STATUS_RESOLVED,
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

    console.info('OccurrenceResolvedHandler: updating occurrence status')

    const occurrenceUpdateResponse: DocumentClient.UpdateItemOutput = await documentClient
      .update(updateParams)
      .promise()

    console.info('OccurrenceResolvedHandler: set occurrence status to resolved')

    const { Attributes: updatedOccurrenceDocument } = occurrenceUpdateResponse

    const {
      applicationId,
      scheduleId,
    } = updatedOccurrenceDocument as schemas.ScheduleOccurrenceDocumentSchema

    console.debug('OccurrenceResolvedHandler: invoking step function', {
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
    console.error('OccurrenceResolvedHandlerError', {
      err,
      event: JSON.stringify(event),
    })

    if (errors.isKnownError(err)) {
      throw err
    }

    throw new errors.UnknownError()
  }
}
