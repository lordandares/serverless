import { errors, schemas } from '@lighthouse/serverless-common'
import { DynamoDB } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as moment from 'moment'

declare var process: {
  env: {
    TABLE_SCHEDULES: string
  }
}

export async function createTimerHandler(
  body: schemas.TimerPayloadSchema,
): Promise<schemas.TimerDocumentSchema> {
  try {
    if (!body) {
      throw new errors.ApplicationError({
        message: 'CreateTimerHandler: missing body on event',
      })
    }

    const { scheduleId, datetime, targetArn, targetPk, targetSk, type } = body

    await schemas.validate({
      data: body,
      schema: schemas.timerPayloadSchema,
    })

    const documentClient = new DynamoDB.DocumentClient()
    const tableName: string = process.env.TABLE_SCHEDULES

    // NOTE: expiry timers occur one minute after datetime
    const timerDueAtMin = moment(datetime)
      .utc()
      .add(1, 'minute')
      .format('YYYY-MM-DDTHH:mm')

    const timerExpiresAt = moment(datetime)
      .utc()
      .add(1, 'day')
      .toDate()
      .toISOString()

    const timerDocument = {
      expiresAt: timerExpiresAt,
      groupType: `${type}-timer`,
      pk: `timer-${timerDueAtMin}`,
      scheduleId,
      sk: `timer#${targetPk}#${targetSk}`,
      targetArn,
    }

    await schemas.validate({
      data: timerDocument,
      schema: schemas.timerDocumentSchema,
    })

    const putTimerParams: DocumentClient.PutItemInput = {
      Item: timerDocument,
      TableName: tableName,
    }

    try {
      await documentClient.put(putTimerParams).promise()
    } catch (error) {
      throw new errors.ApplicationError({ message: error.message })
    }

    return timerDocument
  } catch (err) {
    console.error('CreateTimerError', {
      body,
      err,
    })

    return err
  }
}
