import { schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'

import { createApiEvent } from '../../../../__test__/helpers'
import { scheduleDocument } from '../__fixtures__'
import { getScheduleHandler } from './getScheduleHandler'

beforeEach(() => (process.env.TABLE_SCHEDULES = 'table-schedules'))

test('event headers error', async () => {
  expect.assertions(1)

  const result = await getScheduleHandler(
    createApiEvent({
      headers: null,
      pathParameters: { id: 'schedule1' },
    } as any),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"GetScheduleHandler: missing headers on event\\"}",
  "statusCode": 500,
}
`)
})

test('event pathParameters error', async () => {
  expect.assertions(1)

  const result = await getScheduleHandler(
    createApiEvent({
      headers: { 'lio-application-id': 'application1' },
      pathParameters: null,
    } as any),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"GetScheduleHandler: missing pathParameters on event\\"}",
  "statusCode": 500,
}
`)
})

test('event applicationId header error', async () => {
  expect.assertions(1)

  const result = await getScheduleHandler(
    createApiEvent({
      headers: { 'lio-application-id': '' },
      pathParameters: { id: 'schedule1' },
    } as any),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"The \`applicationId\` is missing from headers\\"}",
  "statusCode": 500,
}
`)
})

test('event path id error', async () => {
  expect.assertions(1)
  const result = await getScheduleHandler(
    createApiEvent({
      headers: { 'lio-application-id': 'application1' },
      pathParameters: { id: '' },
    }),
  )
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ValidationError\\",\\"status\\":400,\\"message\\":\\"The schedule \`id\` is required\\"}",
  "statusCode": 400,
}
`)
})

test('generic error', async () => {
  expect.assertions(2)

  const querySpy = jest.fn().mockRejectedValue(new Error('NetworkError'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await getScheduleHandler(
    createApiEvent({
      headers: { 'lio-application-id': 'application1' },
      pathParameters: { id: 'schedule1' },
    }),
  )
  expect(querySpy).toHaveBeenCalled()
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"NetworkError\\"}",
  "statusCode": 500,
}
`)

  AWS.restore()
})

test('Returns 200 for existing document', async () => {
  expect.assertions(3)

  const querySpy = jest.fn().mockResolvedValue({
    Count: 1,
    Items: [scheduleDocument],
  })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await getScheduleHandler(
    createApiEvent({
      headers: { 'lio-application-id': 'application1' },
      pathParameters: { id: 'schedule1' },
    }),
  )
  expect(querySpy).toHaveBeenCalled()
  expect(querySpy.mock.calls).toMatchSnapshot()
  expect(result).toMatchSnapshot()

  AWS.restore()
})

test('Returns 404 when no documents', async () => {
  expect.assertions(2)

  const querySpy = jest.fn().mockResolvedValue({ Items: [], Count: 0 })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await getScheduleHandler(
    createApiEvent({
      headers: { 'lio-application-id': 'application1' },
      pathParameters: { id: 'schedule1' },
    }),
  )
  expect(querySpy).toHaveBeenCalled()
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ResourceNotFoundError\\",\\"status\\":404,\\"data\\":{\\"resource\\":\\"Schedule\\",\\"id\\":\\"schedule1\\"},\\"message\\":\\"The Resource \\\\\\"Schedule\\\\\\" with ID of \\\\\\"schedule1\\\\\\" could not be found\\"}",
  "statusCode": 404,
}
`)

  AWS.restore()
})
