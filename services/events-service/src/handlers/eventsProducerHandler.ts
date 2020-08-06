import { errors } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { map } from 'lodash'

declare var process: {
  env: {
    KINESIS_EVENTS_STREAM_NAME: string
  }
}

export async function eventsProducerHandler(events: []): Promise<string> {
  try {
    if (!events) {
      throw new errors.ApplicationError({
        message: 'EventsProducerHandler: missing events',
      })
    }

    const Kinesis = AWSXRay.captureAWS(AWS).Kinesis
    const kinesis = new Kinesis()

    const records = map(events, item => ({
      Data: JSON.stringify(item),
      PartitionKey: 'testing',
    }))

    const results = await kinesis
      .putRecords({
        Records: records,
        StreamName: process.env.KINESIS_EVENTS_STREAM_NAME,
      })
      .promise()

    const response = JSON.stringify(results)

    return response
  } catch (err) {
    console.error('EventsProducerHandlerError', {
      err,
      events,
    })

    throw err
  }
}
