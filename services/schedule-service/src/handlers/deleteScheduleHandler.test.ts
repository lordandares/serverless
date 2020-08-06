import * as AWS from 'aws-sdk-mock'

import { createApiEvent } from '../../../../__test__/helpers'
import {
  occurrenceDocument,
  scheduleDocument,
  scheduleLocationDocument,
} from '../__fixtures__'
import { deleteScheduleHandler } from './deleteScheduleHandler'

beforeEach(() => {
  process.env.IS_OFFLINE = 'true'
  process.env.TABLE_SCHEDULES = 'table-schedules'
})

afterEach(() => {
  AWS.restore()
})

test('event headers error', async () => {
  expect.assertions(1)

  const result = await deleteScheduleHandler(
    createApiEvent({
      headers: null,
      pathParameters: { scheduleId: 'schedule1' },
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"DeleteOccurrencesHandler: missing headers on event\\"}",
  "statusCode": 500,
}
`)
})

test('event pathParameters error', async () => {
  expect.assertions(1)

  const result = await deleteScheduleHandler(
    createApiEvent({
      headers: {
        'lio-schedule-id': 'schedule1',
        'lio-user-id': 'user1',
      },
      path: null,
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"DeleteOccurrencesHandler: missing pathParameters on event\\"}",
  "statusCode": 500,
}
`)
})

test('application error returned when missing applicationId', async () => {
  expect.assertions(1)

  const result = await deleteScheduleHandler(
    createApiEvent({
      headers: {
        'lio-schedule-id': 'schedule1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"The \`applicationId\` is missing from headers\\"}",
  "statusCode": 500,
}
`)
})

test('application error returned when missing scheduleId', async () => {
  expect.assertions(1)

  const result = await deleteScheduleHandler(
    createApiEvent({
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { scheduleId: null },
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ValidationError\\",\\"status\\":400,\\"message\\":\\"The schedule \`id\` of the resource to delete is missing\\"}",
  "statusCode": 400,
}
`)
})

test('generic error', async () => {
  expect.assertions(2)

  const querySpy = jest.fn().mockResolvedValue(new Error('NetworkError'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await deleteScheduleHandler(
    createApiEvent({
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )
  expect(querySpy).toHaveBeenCalled()
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"UnknownError\\",\\"status\\":500,\\"message\\":\\"Something went wrong! Try again or contact support if the problem persists.\\"}",
  "statusCode": 500,
}
`)

  AWS.restore()
})

test('logs an error if get location returns empty', async () => {
  expect.assertions(4)

  const querySpy = jest.fn().mockResolvedValue({
    Count: 1,
    Items: [{ ...scheduleDocument }],
  })
  const transactWriteSpy = jest.fn().mockResolvedValue({})
  const getSpy = jest.fn().mockResolvedValue({})
  const consoleSpy = jest.spyOn(console, 'info')
  const putSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  await deleteScheduleHandler(
    createApiEvent({
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )

  expect(querySpy).toHaveBeenCalled()
  expect(transactWriteSpy).toHaveBeenCalled()
  expect(getSpy).toHaveBeenCalled()
  expect(consoleSpy).toHaveBeenCalledWith(
    'RemoveSchedule: Schedule referenced a missing location',
    {
      locationId: 'location1',
      scheduleId: 'schedule1',
    },
  )

  AWS.restore()
})

test('returns 204 if schedule does not exist (idempotency)', async () => {
  expect.assertions(4)

  const querySpy = jest.fn().mockResolvedValue({
    Count: 0,
    Items: [],
  })
  const transactWriteSpy = jest.fn().mockResolvedValue({})
  const getSpy = jest.fn().mockResolvedValue({})
  const putSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const result = await deleteScheduleHandler(
    createApiEvent({
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )

  expect(result).toEqual({
    body: '',
    statusCode: 204,
  })

  expect(querySpy).toHaveBeenCalled()
  expect(transactWriteSpy).not.toHaveBeenCalled()
  expect(getSpy).not.toHaveBeenCalled()

  AWS.restore()
})

test('success delete return 204', async () => {
  expect.assertions(5)

  const querySpy = jest.fn().mockResolvedValue({
    Count: 1,
    Items: [{ ...scheduleDocument }],
  })
  const transactWriteSpy = jest.fn().mockResolvedValue({})
  const getSpy = jest.fn().mockResolvedValue({
    Item: { ...scheduleLocationDocument },
  })
  const putSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const result = await deleteScheduleHandler(
    createApiEvent({
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )

  expect(querySpy).toHaveBeenCalled()
  expect(transactWriteSpy).toHaveBeenCalled()
  expect(getSpy).toHaveBeenCalled()
  expect(putSpy).toHaveBeenCalled()

  expect(result).toEqual({
    body: '',
    statusCode: 204,
  })

  AWS.restore()
})
