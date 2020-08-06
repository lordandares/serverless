import { errors } from '@lighthouse/serverless-common'
import { map } from 'lodash'

export async function eventsConsumerHandler(event): Promise<object[]> {
  try {
    if (!event) {
      throw new errors.ApplicationError({
        message: 'EventsConsumerHandler: missing event',
      })
    }

    console.log('EventConsumerHandler', JSON.stringify(event))
    const { Records } = event

    const decodedRecords: object[] = map(Records, ({ kinesis }) => {
      const decodedRecord = Buffer.from(kinesis.data, 'base64').toString(
        'ascii',
      )
      return JSON.parse(decodedRecord)
    })

    console.log('EventConsumerHandler: decoded records', {
      decodedRecords,
    })

    return decodedRecords
  } catch (err) {
    console.error('EventsConsumerHandlerError', {
      err,
      event,
    })

    throw err
  }
}
