import { errors } from '@lighthouse/serverless-common'
import { reduce, sortBy } from 'lodash'

import { processorStrategies } from './lib/eventProcessors'

interface RecordError {
  error: string
  record: string
}

interface StreamEvent {
  data: {
    _id: string
    application: string
    area: string
    timestamp: string
    user: string
  }
  type: string
  version: number
}

export async function eventConsumerHandler(event): Promise<void> {
  try {
    if (!event) {
      throw new errors.ApplicationError({
        message: 'EventsConsumerHandler: missing event',
      })
    }

    const { Records } = event
    const recordErrors: RecordError[] = []
    const totalCount = Records.length

    console.info(`EventsConsumerHandler: Received ${totalCount} records`)

    const streamEvents = reduce(
      Records,
      (accum: StreamEvent[], record) => {
        try {
          const { kinesis } = record
          const json: string = Buffer.from(kinesis.data, 'base64').toString(
            'ascii',
          )
          const parsedJson: StreamEvent = JSON.parse(json)
          accum.push(parsedJson)
        } catch (error) {
          recordErrors.push({
            error: error.message,
            record: JSON.stringify(record),
          })
        }
        return accum
      },
      [],
    )

    // NOTE: ensure stream events ordered by timestamp
    const sortedStreamEvents = sortBy(
      streamEvents,
      streamEvent => streamEvent.data.timestamp,
    )

    let failedCount = 0
    let processedCount = 0

    for (const streamEvent of sortedStreamEvents) {
      // NOTE istanbul issue with optional chaining which breaks 100% coverage
      // https://github.com/istanbuljs/istanbuljs/issues/516
      // const type = streamEvent?.type
      const type = streamEvent && streamEvent.type

      if (!type) {
        continue
      }

      const processorFn = processorStrategies[type]

      if (!processorFn) {
        continue
      }

      try {
        await processorFn(streamEvent)
        processedCount++
      } catch (error) {
        console.error('EventsConsumerHandlerError', { error, streamEvent })
        failedCount++
        continue
      }
    }

    console.info(
      `EventsConsumerHandler: ${processedCount} processed / ${failedCount} failed of ${totalCount} records`,
    )

    if (recordErrors.length) {
      const message = `EventsConsumerHandler: caught ${
        recordErrors.length
      } errors when processing ${Records.length} records`
      console.error(message)

      throw new errors.ApplicationError({
        data: { errors: JSON.stringify(recordErrors) },
        message,
      })
    }
  } catch (err) {
    console.error('EventsConsumerHandlerError', {
      err,
      event,
    })

    throw err
  }
}
