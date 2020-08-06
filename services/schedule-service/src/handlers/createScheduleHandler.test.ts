import { mongo, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'

import { createApiEvent } from '../../../../__test__/helpers'
import {
  areaDocument,
  scheduleDocument,
  schedulePayload,
} from '../__fixtures__'
import { createScheduleHandler } from './createScheduleHandler'

jest.mock('../service/lib/transform', () => {
  const {
    scheduleDocument: document,
    schedulePayload: payload,
  } = require('../__fixtures__')

  return {
    documentToSchedulePayload: () => payload,
    payloadToScheduleDocument: () => document,
  }
})

beforeEach(() => {
  process.env.CREATE_SCHEDULE_STEP_FUNCTION = 'create-schedule-step-function'
  process.env.IS_OFFLINE = 'true'
  process.env.TABLE_SCHEDULES = 'table-schedules'

  MockDate.set('2019-10-14T00:00:00.000Z')
})

afterEach(() => MockDate.reset())

test('event body error', async () => {
  expect.assertions(1)

  const result = await createScheduleHandler(
    createApiEvent({
      body: null,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"CreateScheduleHandler: missing body on event\\"}",
  "statusCode": 500,
}
`)
})

test('event headers error', async () => {
  expect.assertions(1)

  const result = await createScheduleHandler(
    createApiEvent({
      body: {},
      headers: null,
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"CreateScheduleHandler: missing headers on event\\"}",
  "statusCode": 500,
}
`)
})

test('event applicationId header error', async () => {
  expect.assertions(1)

  const result = await createScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': '',
        'lio-user-id': 'user1',
      },
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"The \`applicationId\` is missing from headers\\"}",
  "statusCode": 500,
}
`)
})

test('event userId header error', async () => {
  expect.assertions(1)

  const result = await createScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': '',
      },
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"The \`userId\` is missing from headers\\"}",
  "statusCode": 500,
}
`)
})

test('event body error', async () => {
  expect.assertions(1)

  const result = await createScheduleHandler(
    createApiEvent({
      body: {},
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ValidationError\\",\\"status\\":400,\\"message\\":\\"A schedule body is required\\"}",
  "statusCode": 400,
}
`)
})

test('generic error', async () => {
  expect.assertions(2)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockRejectedValue(new Error('NetworkError'))

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const result = await createScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
    }),
  )

  expect(putSpy).toHaveBeenCalled()
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"NetworkError\\"}",
  "statusCode": 500,
}
`)

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('application error', async () => {
  expect.assertions(1)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const validateSpy = jest.spyOn(schemas, 'validate')

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  validateSpy.mockImplementation(
    jest
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Schedule has malformed data')),
  )

  const result = await createScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
    }),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"Schedule has malformed data\\"}",
  "statusCode": 500,
}
`)

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()
  validateSpy.mockRestore()
})

test('validates against payload schema', async () => {
  expect.assertions(1)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({ TableName: 'schedule-table' })
  const startExecutionSpy = jest.fn().mockResolvedValue({})
  const validateSpy = jest.spyOn(schemas, 'validate')

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  await createScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
    }),
  )

  expect(validateSpy).toHaveBeenCalledWith({
    data: schedulePayload,
    schema: schemas.schedulePayloadSchema,
  })

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()
  validateSpy.mockRestore()

  AWS.restore()
})

test('validates against document schema', async () => {
  expect.assertions(1)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const startExecutionSpy = jest.fn().mockResolvedValue({})
  const validateSpy = jest.spyOn(schemas, 'validate')

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  await createScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
    }),
  )

  expect(validateSpy).toHaveBeenCalledWith({
    data: scheduleDocument,
    options: { context: { isNew: true } },
    schema: schemas.scheduleDocumentSchema,
  })

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()
  validateSpy.mockRestore()

  AWS.restore()
})

test('returns 201 with new document', async () => {
  expect.assertions(4)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const startExecutionSpy = jest.fn().mockResolvedValue({})

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  const result = await createScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
    }),
  )

  expect(startExecutionSpy.mock.calls).toMatchSnapshot()
  expect(putSpy.mock.calls).toMatchSnapshot()
  expect(startExecutionSpy.mock.calls).toMatchSnapshot()
  expect(result).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('returns 201 with new document when locations missing', async () => {
  expect.assertions(1)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const startExecutionSpy = jest.fn().mockResolvedValue({})

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(undefined),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  const result = await createScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
    }),
  )

  expect(result).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})
