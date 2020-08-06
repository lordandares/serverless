import { mongo, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'

import { createContext, createSnsEvent } from '../../../../__test__/helpers'
import {
  areaDocument,
  scheduleDocument,
  scheduleLocationDocument,
} from '../__fixtures__'
import { ScheduleService } from '../service/ScheduleService'
import { upsertLocationsHandler } from './upsertLocationsHandler'

beforeEach(() => {
  process.env.TABLE_SCHEDULES = 'table-schedules'
  MockDate.set('2019-10-13T01:00:00.000Z')
})

afterEach(() => MockDate.reset())

test('event body error', async () => {
  expect.assertions(1)

  const event = createSnsEvent({
    body: null,
  })

  const context = createContext()

  try {
    await upsertLocationsHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: UpsertLocationHandler: missing payload]`,
    )
  }
})

test('event context error', async () => {
  expect.assertions(1)

  const event = createSnsEvent({
    body: {
      applicationId: 'app1',
      locations: ['location1'],
      scheduleId: 'schedule1',
    },
  })

  const context = null

  try {
    await upsertLocationsHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: UpsertLocationHandler: missing context]`,
    )
  }
})

test('application error returned when missing applicationId', async () => {
  expect.assertions(1)

  const event = {
    applicationId: null,
    locations: ['location1'],
    scheduleId: 'schedule1',
  }

  const context = createContext()

  try {
    await upsertLocationsHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The \`applicationId\` is missing]`,
    )
  }
})

test('application error returned when missing arn', async () => {
  expect.assertions(1)

  const event = {
    applicationId: 'app1',
    locations: ['location1'],
    scheduleId: 'schedule1',
  }

  const context = { awsRequestId: 'arnId', invokedFunctionArn: null } as any

  try {
    await upsertLocationsHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The \`arn\` is missing]`,
    )
  }
})

test('application error returned when missing arnId', async () => {
  expect.assertions(1)

  const event = {
    applicationId: 'app1',
    locations: ['location1'],
    scheduleId: 'schedule1',
  }

  const context = { awsRequestId: null, invokedFunctionArn: 'arn' } as any

  try {
    await upsertLocationsHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The \`arnId\` is missing]`,
    )
  }
})

test('application error returned when missing locationId', async () => {
  expect.assertions(1)

  const event = {
    applicationId: 'app1',
    locations: [null],
    scheduleId: 'schedule1',
  }

  const context = createContext()

  try {
    await upsertLocationsHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The \`locationId\` is missing]`,
    )
  }
})

test('generic error', async () => {
  expect.assertions(2)

  const upsertLocationSpy = jest.spyOn(ScheduleService, 'upsertLocation')

  upsertLocationSpy.mockImplementation(
    jest.fn().mockRejectedValueOnce(new Error('Unknown Error')),
  )

  const event = createSnsEvent({
    body: {
      applicationId: 'app1',
      locations: ['location1'],
      scheduleId: 'schedule1',
    },
  })

  const context = createContext()

  try {
    await upsertLocationsHandler(event, context)
  } catch (error) {
    expect(upsertLocationSpy).toHaveBeenCalled()
    expect(error).toMatchInlineSnapshot(
      `[UnknownError: Something went wrong! Try again or contact support if the problem persists.]`,
    )
  }

  upsertLocationSpy.mockRestore()
})

test('application error when validation error', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: undefined })
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
    jest.fn().mockRejectedValueOnce(new Error('Location has malformed data')),
  )

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  const event = createSnsEvent({
    body: {
      applicationId: 'app1',
      locations: ['location1'],
      scheduleId: 'schedule1',
    },
  })

  const context = createContext()

  try {
    await upsertLocationsHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: Location has malformed data]`,
    )
  }

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()
  validateSpy.mockRestore()

  AWS.restore()
})

test('location error', async () => {
  expect.assertions(1)

  const getSpy = jest
    .fn()
    .mockRejectedValue(new Error('Error getting location'))
  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  const event = createSnsEvent({
    body: {
      applicationId: 'app1',
      locations: ['location1'],
      scheduleId: 'schedule1',
    },
  })

  const context = createContext()

  try {
    await upsertLocationsHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: Error getting location]`,
    )
  }

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('returns created document from sns event', async () => {
  expect.assertions(2)

  const getSpy = jest.fn().mockResolvedValue({ Item: undefined })
  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const putSpy = jest.fn().mockResolvedValue({})
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const event = createSnsEvent({
    body: {
      applicationId: 'app1',
      locations: ['location1'],
      scheduleId: 'schedule1',
    },
  })

  const context = createContext()

  const result = await upsertLocationsHandler(event, context)

  expect(putSpy.mock.calls).toMatchSnapshot()
  expect(result).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('returns created document from simple payload', async () => {
  expect.assertions(2)

  const getSpy = jest.fn().mockResolvedValue({ Item: undefined })
  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const putSpy = jest.fn().mockResolvedValue({})
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const event = {
    applicationId: 'app1',
    locations: ['location1'],
    scheduleId: 'schedule1',
  }

  const context = createContext()

  const result = await upsertLocationsHandler(event, context)

  expect(putSpy.mock.calls).toMatchSnapshot()
  expect(result).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('syncs schedules when given associated location schedules and schedule id', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({ Items: [scheduleDocument] })

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = {
    applicationId: 'app1',
    locations: ['location1'],
    scheduleId: 'schedule1',
  }

  const context = createContext()

  await upsertLocationsHandler(event, context)

  expect(putSpy.mock.calls).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('syncs schedules when given associated location schedules and no schedule id', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({ Items: [scheduleDocument] })

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = {
    applicationId: 'app1',
    locations: ['location1'],
  }

  const context = createContext()

  const result = await upsertLocationsHandler(event, context)

  expect(putSpy.mock.calls).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('syncs schedules when no given associated location schedules and schedule id', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({ Items: [] })

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = {
    applicationId: 'app1',
    locations: ['location1'],
    scheduleId: 'schedule1',
  }

  const context = createContext()

  const result = await upsertLocationsHandler(event, context)

  expect(putSpy.mock.calls).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('syncs schedules when no given associated location schedules and no schedule id', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({ Items: [] })

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = {
    applicationId: 'app1',
    locations: ['location1'],
  }

  const context = createContext()

  const result = await upsertLocationsHandler(event, context)

  expect(putSpy.mock.calls).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})

test('doesnt sync any schedules when no location and no schedule id', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: undefined })
  const getCollectionSpy = jest.spyOn(mongo, 'getCollection')
  const objectIdSpy = jest.spyOn(mongo, 'ObjectId')
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({ Items: [] })

  getCollectionSpy.mockImplementation(
    jest.fn().mockResolvedValue({
      findOne: jest.fn().mockResolvedValue(areaDocument),
    }),
  )
  objectIdSpy.mockImplementation(jest.fn().mockReturnValue('id'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = {
    applicationId: 'app1',
    locations: ['location1'],
  }

  const context = createContext()

  const result = await upsertLocationsHandler(event, context)

  expect(putSpy.mock.calls).toMatchSnapshot()

  getCollectionSpy.mockRestore()
  objectIdSpy.mockRestore()

  AWS.restore()
})
