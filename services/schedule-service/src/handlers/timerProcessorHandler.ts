import { errors, schemas } from '@lighthouse/serverless-common'
import { DynamoDB, SNS } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as BPromise from 'bluebird'
import * as moment from 'moment'

declare var process: {
  env: {
    TABLE_SCHEDULES: string
  }
}

interface Document {
  pk: string
  sk: string
}

interface TimerError {
  error: Error
  timer: schemas.TimerDocumentSchema
}

export async function timerProcessorHandler(): Promise<
  schemas.TimerDocumentSchema[]
> {
  try {
    const documentClient = new DynamoDB.DocumentClient()
    const sns = new SNS()
    const tableName = process.env.TABLE_SCHEDULES

    const mNow = moment.utc()

    // NOTE: we query both minutes in case when processing we go into the following minute
    const currentMinute = mNow.format('YYYY-MM-DDTHH:mm')
    const previousMinute = mNow.subtract(1, 'minute').format('YYYY-MM-DDTHH:mm')

    const currentMinuteQueryParams: DocumentClient.QueryInput = {
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': `timer-${currentMinute}`,
      },
      KeyConditionExpression: '#pk = :pk',
      ScanIndexForward: false,
      TableName: tableName,
    }

    const previousMinuteQueryParams: DocumentClient.QueryInput = {
      ExpressionAttributeNames: {
        '#pk': 'pk',
      },
      ExpressionAttributeValues: {
        ':pk': `timer-${previousMinute}`,
      },
      KeyConditionExpression: '#pk = :pk',
      ScanIndexForward: false,
      TableName: tableName,
    }

    console.info(
      `TimerProcessorHandler: querying for current minute timers with ${currentMinute}`,
    )
    console.info(
      `TimerProcessorHandler: querying for previous minute timers with ${previousMinute}`,
    )

    const currentMinuteQueryResponse = await documentClient
      .query(currentMinuteQueryParams)
      .promise()
    const previousMinuteQueryResponse = await documentClient
      .query(previousMinuteQueryParams)
      .promise()

    const { Items: currentMinuteItems } = currentMinuteQueryResponse
    const { Items: previousMinuteItems } = previousMinuteQueryResponse

    const expiredTimers =
      currentMinuteItems && previousMinuteItems
        ? [...currentMinuteItems, ...previousMinuteItems]
        : []

    if (!expiredTimers.length) {
      console.info('TimerProcessorHandler: no timers to process')
      return []
    }

    console.info(
      `TimerProcessorHandler: processing ${expiredTimers.length} timers`,
    )

    const deleteTimerErrors: TimerError[] = []
    const processTimerErrors: TimerError[] = []

    const processedTimers = await BPromise.reduce(
      expiredTimers,
      async (accum: Document[], expiredTimer: schemas.TimerDocumentSchema) => {
        const { pk: timerPk, sk: timerSk, targetArn } = expiredTimer

        try {
          const parts = timerSk.split('#')
          const targetPk: string = parts[1]
          const targetSk: string = parts[2]

          const snsParams: SNS.Types.PublishInput = {
            Message: JSON.stringify({
              pk: targetPk,
              sk: targetSk,
            }),
            TargetArn: targetArn,
          }

          console.info(
            `TimerProcessorHandler: publishing to targetArn: ${targetArn}`,
          )

          await sns.publish(snsParams).promise()

          accum.push({ pk: timerPk, sk: timerSk })

          return accum
        } catch (error) {
          console.warn(
            `TimerProcessorHandler: publishing to targetArn: ${targetArn} failed`,
          )
          processTimerErrors.push({ error, timer: expiredTimer })
          return accum
        }
      },
      [],
    )

    console.info(
      `TimerProcessorHandler: processed ${processedTimers.length} timers`,
    )

    if (processedTimers.length) {
      console.info(
        `TimerProcessorHandler: removing ${processedTimers.length} timers`,
      )

      await BPromise.each(processedTimers, async timer => {
        try {
          const deleteParams = {
            Key: { pk: timer.pk, sk: timer.sk },
            TableName: tableName,
          }
          await documentClient.delete(deleteParams).promise()
        } catch (error) {
          console.warn('TimerProcessorHandler: deleting timer failed')
          deleteTimerErrors.push({ error, timer })
        }
      })
    }

    if (processTimerErrors.length) {
      const message = `TimerProcessorHandler: caught ${
        processTimerErrors.length
      } processing errors for ${expiredTimers.length} timers`

      throw new errors.ApplicationError({
        data: { errors: JSON.stringify(processTimerErrors) },
        message,
      })
    }

    if (deleteTimerErrors.length) {
      const message = `TimerProcessorHandler: caught ${
        deleteTimerErrors.length
      } delete errors for ${deleteTimerErrors.length} timers`

      console.error(message)

      throw new errors.ApplicationError({
        data: { errors: JSON.stringify(deleteTimerErrors) },
        message,
      })
    }

    return processedTimers
  } catch (error) {
    console.error('TimerProcessorHandlerError', {
      error,
    })

    throw error
  }
}
