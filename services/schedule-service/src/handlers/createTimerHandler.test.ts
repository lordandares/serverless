import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'

import { createTimerHandler } from './createTimerHandler'

beforeEach(() => {
  process.env.IS_OFFLINE = 'true'
  process.env.TABLE_SCHEDULES = 'table-schedules'
})

afterEach(() => {
  AWS.restore()
})

test('successful timer creation', async () => {
  expect.assertions(1)

  const putSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const result = await createTimerHandler({
    scheduleId: 'schedule1',
    datetime: '2019-10-13T23:59:59.999Z',
    targetArn: 'someArn',
    targetPk: 'pk',
    targetSk: 'sk',
    type: 'occurrence',
  })

  expect(result).toMatchInlineSnapshot(`
Object {
  "expiresAt": "2019-10-14T23:59:59.999Z",
  "groupType": "occurrence-timer",
  "pk": "timer-2019-10-14T00:00",
  "scheduleId": "schedule1",
  "sk": "timer#pk#sk",
  "targetArn": "someArn",
}
`)
})

test('unsuccessful timer creation', async () => {
  expect.assertions(1)

  const putSpy = jest.fn().mockRejectedValue(new Error('NetworkError'))

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const result = await createTimerHandler({
    scheduleId: 'schedule1',
    datetime: '2019-10-13T23:59:59.999Z',
    targetArn: 'someArn',
    targetPk: 'pk',
    targetSk: 'sk',
    type: 'occurrence',
  })

  expect(result).toMatchInlineSnapshot(`[ApplicationError: NetworkError]`)
})

test('missing body', async () => {
  expect.assertions(1)

  const putSpy = jest.fn().mockRejectedValue(new Error('NetworkError'))

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const result = await createTimerHandler(null)

  expect(result).toMatchInlineSnapshot(
    `[ApplicationError: CreateTimerHandler: missing body on event]`,
  )
})

test('validation error, missing target pk', async () => {
  expect.assertions(1)

  const putSpy = jest.fn().mockRejectedValue(new Error('NetworkError'))

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const result = await createTimerHandler({
    scheduleId: 'schedule1',
    datetime: '2019-10-13T23:59:59.999Z',
    targetArn: 'someArn',
    targetSk: 'sk',
    type: 'occurrence',
  })

  expect(result).toMatchInlineSnapshot(
    `[ValidationError: targetPk is a required field]`,
  )
})
