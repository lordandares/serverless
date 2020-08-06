import { schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'

import { createApiEvent } from '../../../../__test__/helpers'
import { scheduleDocument } from '../__fixtures__'
import { listSchedulesHandler } from './listSchedulesHandler'

beforeEach(() => (process.env.TABLE_SCHEDULES = 'table-schedules'))

test('event headers error', async () => {
  expect.assertions(1)

  const result = await listSchedulesHandler(createApiEvent({ headers: null }))

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"ListSchedulesHandlers: missing headers on event\\"}",
  "statusCode": 500,
}
`)
})

test('event applicationId header error', async () => {
  expect.assertions(1)

  const result = await listSchedulesHandler(
    createApiEvent({
      headers: { 'lio-application-id': '' },
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"The \`applicationId\` is missing from headers\\"}",
  "statusCode": 500,
}
`)
})

test('generic error', async () => {
  expect.assertions(2)

  const querySpy = jest.fn().mockRejectedValue(new Error('NetworkError'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await listSchedulesHandler(
    createApiEvent({ headers: { 'lio-application-id': 'application1' } }),
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

test('Returns 200 for existing documents', async () => {
  expect.assertions(3)

  const querySpy = jest.fn().mockResolvedValue({
    Count: 1,
    Items: [{ ...scheduleDocument }],
  })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await listSchedulesHandler(
    createApiEvent({ headers: { 'lio-application-id': 'application1' } }),
  )

  expect(querySpy).toHaveBeenCalled()
  expect(querySpy.mock.calls).toMatchSnapshot()
  expect(result).toMatchSnapshot()

  AWS.restore()
})
