import { mongo, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'

import { createApiEvent } from '../../../../__test__/helpers'
import {
  areaDocument,
  scheduleDocument,
  schedulePayload,
} from '../__fixtures__'
import { updateScheduleHandler } from './updateScheduleHandler'

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
  process.env.IS_OFFLINE = 'true'
  process.env.TABLE_SCHEDULES = 'table-schedules'
  process.env.UPDATE_SCHEDULE_STEP_FUNCTION = 'update-schedule-step-function'

  MockDate.set('2019-10-14T00:00:00.000Z')
})

afterEach(() => MockDate.reset())

test('event body error', async () => {
  expect.assertions(1)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: null,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"UpdateScheduleHandler: missing body on event\\"}",
  "statusCode": 500,
}
`)
})

test('event headers error', async () => {
  expect.assertions(1)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: {},
      headers: null,
      pathParameters: { id: 'schedule1' },
    }),
  )
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"UpdateScheduleHandler: missing headers on event\\"}",
  "statusCode": 500,
}
`)
})

test('event pathParameters error', async () => {
  expect.assertions(1)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: {},
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: null,
    }),
  )
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"UpdateScheduleHandler: missing pathParameters on event\\"}",
  "statusCode": 500,
}
`)
})

test('event applicationId header error', async () => {
  expect.assertions(1)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': '',
        'lio-user-id': 'user1',
      },
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

test('event userId header error', async () => {
  expect.assertions(1)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': '',
      },
      pathParameters: { id: 'schedule1' },
    } as any),
  )

  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"The \`userId\` is missing from headers\\"}",
  "statusCode": 500,
}
`)
})

test('event path id error', async () => {
  expect.assertions(1)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
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

test('event body error', async () => {
  expect.assertions(1)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: {},
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ValidationError\\",\\"status\\":400,\\"message\\":\\"A schedule body is required\\"}",
  "statusCode": 400,
}
`)
})

test('not found error', async () => {
  expect.assertions(2)

  const querySpy = jest.fn().mockResolvedValue({
    Count: 0,
    Items: [],
  })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )
  expect(result).toMatchInlineSnapshot(`
Object {
  "body": "{\\"name\\":\\"ResourceNotFoundError\\",\\"status\\":404,\\"data\\":{\\"resource\\":\\"Schedule\\",\\"id\\":\\"schedule1\\"},\\"message\\":\\"The Resource \\\\\\"Schedule\\\\\\" with ID of \\\\\\"schedule1\\\\\\" could not be found\\"}",
  "statusCode": 404,
}
`)
  expect(querySpy).toHaveBeenCalled()
  AWS.restore()
})

test('generic error', async () => {
  expect.assertions(2)

  const querySpy = jest.fn().mockRejectedValue(new Error('NetworkError'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: schedulePayload,
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
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"NetworkError\\"}",
  "statusCode": 500,
}
`)

  AWS.restore()
})

test('application error', async () => {
  expect.assertions(2)

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

  const querySpy = jest.fn().mockResolvedValue({
    Count: 1,
    Items: [{ ...scheduleDocument }],
  })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: schedulePayload,
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
  "body": "{\\"name\\":\\"ApplicationError\\",\\"status\\":500,\\"message\\":\\"Schedule has malformed data\\"}",
  "statusCode": 500,
}
`)

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()
  validateSpy.mockRestore()

  AWS.restore()
})

test('validates against payload schema', async () => {
  expect.assertions(1)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Count: 1,
    Items: [{ ...scheduleDocument }],
  })
  const startExecutionSpy = jest.fn().mockResolvedValue({})
  const validateSpy = jest.spyOn(schemas, 'validate')

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  await updateScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )

  expect(validateSpy).toHaveBeenCalledWith({
    data: schedulePayload,
    schema: schemas.schedulePayloadSchema,
  })

  validateSpy.mockRestore()

  AWS.restore()
})

test('validates against document schema', async () => {
  expect.assertions(1)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Count: 1,
    Items: [{ ...scheduleDocument }],
  })
  const startExecutionSpy = jest.fn().mockResolvedValue({})
  const validateSpy = jest.spyOn(schemas, 'validate')

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  await updateScheduleHandler(
    createApiEvent({
      body: schedulePayload,
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )

  expect(validateSpy).toHaveBeenCalledWith({
    data: scheduleDocument,
    options: { context: { isNew: false } },
    schema: schemas.scheduleDocumentSchema,
  })

  validateSpy.mockRestore()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('returns 200 with updated document', async () => {
  expect.assertions(3)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Count: 1,
    Items: [{ ...scheduleDocument }],
  })
  const startExecutionSpy = jest.fn().mockResolvedValue({})

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: { ...schedulePayload },
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )

  expect(putSpy.mock.calls).toMatchSnapshot()
  expect(startExecutionSpy.mock.calls).toMatchSnapshot()
  expect(result).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('returns 200 with updated document when locations missing', async () => {
  expect.assertions(2)

  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Count: 1,
    Items: [{ ...scheduleDocument }],
  })
  const startExecutionSpy = jest.fn().mockResolvedValue({})

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(undefined),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  const result = await updateScheduleHandler(
    createApiEvent({
      body: { ...schedulePayload },
      headers: {
        'lio-application-id': 'application1',
        'lio-user-id': 'user1',
      },
      pathParameters: { id: 'schedule1' },
    }),
  )

  expect(putSpy.mock.calls).toMatchSnapshot()
  expect(result).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})
