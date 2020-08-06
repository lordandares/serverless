import { scheduling } from '@lighthouse/common'
import { schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'
import * as uuid from 'uuid'

import { createContext, createSnsEvent } from '../../../../__test__/helpers'
import {
  occurrenceDocument,
  scheduleDocument,
  scheduleLocationDocument,
} from '../__fixtures__'
import { OCCURRENCE_STATUS_PENDING } from '../constants'
import { ScheduleService } from '../service/ScheduleService'
import { generateOccurrencesHandler } from './generateOccurrencesHandler'

beforeEach(() => {
  process.env.TABLE_SCHEDULES = 'table-schedules'
  MockDate.set('2019-10-14T00:00:00.000Z')
})

afterEach(() => {
  jest.clearAllMocks()
  MockDate.reset()
})

test('event error', async () => {
  expect.assertions(1)

  const event = null
  const context = createContext()

  try {
    await generateOccurrencesHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: GenerateOccurrencesHandler: missing event]`,
    )
  }
})

test('context error', async () => {
  expect.assertions(1)

  const event = { scheduleId: 'schedule1' }
  const context = null

  try {
    await generateOccurrencesHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: GenerateOccurrencesHandler: missing context]`,
    )
  }
})

test('unknown error', async () => {
  expect.assertions(1)

  const querySpy = jest
    .fn()
    .mockRejectedValue(new Error('Unbelivable scenes here Jeff!'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  try {
    await generateOccurrencesHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[UnknownError: Something went wrong! Try again or contact support if the problem persists.]`,
    )
  }

  AWS.restore()
})

test('application error returned when missing scheduleId', async () => {
  expect.assertions(1)

  const event = { scheduleId: null }
  const context = createContext()

  try {
    await generateOccurrencesHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The \`scheduleId\` is missing]`,
    )
  }
})

test('application error returned when missing awsRequestId', async () => {
  expect.assertions(1)

  const event = { scheduleId: 'schedule1' }
  const context = { awsRequestId: null, invokedFunctionArn: 'arn' } as any

  try {
    await generateOccurrencesHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The \`awsRequestId\` is missing]`,
    )
  }
})

test('application error returned when missing invokedFunctionArn', async () => {
  expect.assertions(1)

  const event = { scheduleId: 'schedule1' }
  const context = { awsRequestId: 'arnId', invokedFunction: null } as any

  try {
    await generateOccurrencesHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The \`invokedFunctionArn\` is missing]`,
    )
  }
})

test('application error returned when schedule is not found', async () => {
  expect.assertions(1)

  const querySpy = jest.fn().mockResolvedValue({ Items: [] })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  try {
    await generateOccurrencesHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ResourceNotFoundError: The Resource "schedule" with ID of "schedule1" could not be found]`,
    )
  }

  AWS.restore()
})

test('application error returned when multiple schedules found', async () => {
  expect.assertions(1)

  const querySpy = jest
    .fn()
    .mockResolvedValue({ Items: [scheduleDocument, scheduleDocument] })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  try {
    await generateOccurrencesHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The schedule query returned multiple items]`,
    )
  }

  AWS.restore()
})

test('warns and skips occurrence when no schedule location returned', async () => {
  expect.assertions(2)

  const getSpy = jest.fn().mockResolvedValue({ Item: null })
  const querySpy = jest
    .fn()
    .mockResolvedValue({ Items: [scheduleDocument, occurrenceDocument] })
  const warnSpy = jest.spyOn(console, 'warn')

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  const results = await generateOccurrencesHandler(event, context)

  expect(results).toEqual([])
  expect(warnSpy).toBeCalledWith(
    'GenerateOccurrencesHandler: location is missing so skipping',
    { id: '{"pk":"application1-location","sk":"location1"}' },
  )

  AWS.restore()
})

test('returns no occurrences when schedule is not enabled', async () => {
  expect.assertions(1)

  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        data: {
          ...scheduleDocument.data,
          enabled: false,
        },
      },
    ],
  })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  const results = await generateOccurrencesHandler(event, context)
  expect(results).toEqual([])

  AWS.restore()
})

test('returns no occurrences when schedule endAt is in past', async () => {
  expect.assertions(1)

  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        endAt: '2018-12-06T13:00:00.000Z',
      },
    ],
  })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  const results = await generateOccurrencesHandler(event, context)
  expect(results).toEqual([])

  AWS.restore()
})

test('returns no occurrences when schedule already has max stopwatch occurrences', async () => {
  expect.assertions(2)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const querySpy = jest.fn().mockResolvedValue({
    Items: [scheduleDocument, { ...occurrenceDocument, locationId: 'area1' }],
  })
  const warnSpy = jest.spyOn(console, 'warn')

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  const results = await generateOccurrencesHandler(event, context)
  expect(results).toEqual([])
  expect(warnSpy).toHaveBeenCalledWith(
    'GenerateOccurrencesHandler: skipping next occurrence as reached limit of 1 for area1',
  )

  AWS.restore()
})

test('returns no occurrences when schedule already has max occurrences', async () => {
  expect.assertions(2)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        data: {
          ...scheduleDocument.data,
          strategy: {
            ...scheduleDocument.data.strategy,
            type: scheduling.StrategyTypes.Window,
          },
        },
      },
      { ...occurrenceDocument, locationId: 'area1' },
      { ...occurrenceDocument, locationId: 'area1' },
    ],
  })
  const warnSpy = jest.spyOn(console, 'warn')

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  const results = await generateOccurrencesHandler(event, context)
  expect(results).toEqual([])
  expect(warnSpy).toHaveBeenCalledWith(
    'GenerateOccurrencesHandler: skipping next occurrence as reached limit of 2 for area1',
  )

  AWS.restore()
})

test('validates against document schema', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        endAt: '2020-01-01T00:00:00.000Z',
        startAt: '2019-01-01T00:00:00.000Z',
      },
    ],
  })
  const v4Spy = jest.spyOn(uuid, 'v4')
  const validateSpy = jest.spyOn(schemas, 'validate')

  v4Spy.mockImplementation(jest.fn().mockReturnValue('1111-2222-3333-4444'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  await generateOccurrencesHandler(event, context)

  expect(validateSpy).toHaveBeenCalledWith({
    data: {
      applicationId: 'application1',
      createdAt: '2019-10-14T00:00:00.000Z',
      createdBy: {
        id: 'awsRequestId',
        label: 'invokedFunctionArn',
        type: 'system',
      },
      data: {
        occurrenceInterval: [1571011200000, 1571012099999],
        scheduleName: 'Schedule One',
        serviceInterval: [1571011200000, 1571058000000],
        timezone: 'Australia/Melbourne',
      },
      endAt: '2019-10-14T00:14:59.999Z',
      groupType: 'occurrence',
      locationId: 'area1',
      location_endAt_occurrenceId:
        'area1-2019-10-14T00:14:59.999Z-1111-2222-3333-4444',
      occurrenceId: '1111-2222-3333-4444',
      pk: 'application1-occurrence',
      scheduleId: 'schedule1',
      sk: '2019-10-14T00:00:00.000Z-1111-2222-3333-4444',
      startAt: '2019-10-14T00:00:00.000Z',
      status: OCCURRENCE_STATUS_PENDING,
      updatedAt: '2019-10-14T00:00:00.000Z',
      updatedBy: {
        id: 'awsRequestId',
        label: 'invokedFunctionArn',
        type: 'system',
      },
    },
    schema: schemas.scheduleOccurrenceDocumentSchema,
  })

  v4Spy.mockRestore()
  validateSpy.mockRestore()

  AWS.restore()
})

test('application error when validation fails against document schema', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        applicationId: 123456789,
        endAt: '2020-01-01T00:00:00.000Z',
        startAt: '2019-01-01T00:00:00.000Z',
      },
    ],
  })
  const v4Spy = jest.spyOn(uuid, 'v4')

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  try {
    await generateOccurrencesHandler(event, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: GenerateOccurrencesHandler: applicationId must be a \`string\` type, but the final value was: \`123456789\`.]`,
    )
  }

  v4Spy.mockRestore()

  AWS.restore()
})

test('generates occurrences for schedule when no areas', async () => {
  expect.assertions(3)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        data: {
          ...scheduleDocument.data,
          areas: [],
        },
        endAt: '2020-01-01T00:00:00.000Z',
        startAt: '2019-01-01T00:00:00.000Z',
      },
    ],
  })
  const v4Spy = jest.spyOn(uuid, 'v4')

  v4Spy.mockImplementation(jest.fn().mockReturnValue('1111-2222-3333-4444'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  await generateOccurrencesHandler(event, context)

  expect(querySpy.mock.calls).toMatchSnapshot()
  expect(getSpy.mock.calls).toMatchSnapshot()
  expect(putSpy.mock.calls).toMatchSnapshot()

  v4Spy.mockRestore()

  AWS.restore()
})

test('generates occurrences for schedule when no schedule end', async () => {
  expect.assertions(3)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        endAt: null,
        startAt: '2019-01-01T00:00:00.000Z',
      },
    ],
  })
  const v4Spy = jest.spyOn(uuid, 'v4')

  v4Spy.mockImplementation(jest.fn().mockReturnValue('1111-2222-3333-4444'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  await generateOccurrencesHandler(event, context)

  expect(querySpy).toHaveBeenCalledTimes(1)
  expect(getSpy).toHaveBeenCalledTimes(1)
  expect(putSpy.mock.calls).toMatchSnapshot()

  v4Spy.mockRestore()

  AWS.restore()
})

test('generates occurrences for schedule when overriding service hours', async () => {
  expect.assertions(3)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        endAt: '2020-01-01T00:00:00.000Z',
        startAt: '2019-01-01T00:00:00.000Z',
      },
    ],
  })
  const v4Spy = jest.spyOn(uuid, 'v4')

  v4Spy.mockImplementation(jest.fn().mockReturnValue('1111-2222-3333-4444'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  await generateOccurrencesHandler(event, context)

  expect(querySpy).toHaveBeenCalledTimes(1)
  expect(getSpy).toHaveBeenCalledTimes(1)
  expect(putSpy.mock.calls).toMatchSnapshot()

  v4Spy.mockRestore()

  AWS.restore()
})

test('generates occurrences for schedule when no overriding service hours', async () => {
  expect.assertions(3)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        data: {
          ...scheduleDocument.data,
          serviceHours: null,
        },
        endAt: '2020-01-01T00:00:00.000Z',
        startAt: '2019-01-01T00:00:00.000Z',
      },
    ],
  })
  const v4Spy = jest.spyOn(uuid, 'v4')

  v4Spy.mockImplementation(jest.fn().mockReturnValue('1111-2222-3333-4444'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  await generateOccurrencesHandler(event, context)

  expect(querySpy).toHaveBeenCalledTimes(1)
  expect(getSpy).toHaveBeenCalledTimes(1)
  expect(putSpy.mock.calls).toMatchSnapshot()

  v4Spy.mockRestore()

  AWS.restore()
})

test('generates occurrences for schedule with startAt time if in future', async () => {
  expect.assertions(3)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        endAt: '2020-01-01T00:00:00.000Z',
        startAt: '2019-12-01T00:00:00.000Z',
      },
    ],
  })
  const v4Spy = jest.spyOn(uuid, 'v4')

  v4Spy.mockImplementation(jest.fn().mockReturnValue('1111-2222-3333-4444'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  await generateOccurrencesHandler(event, context)

  expect(querySpy).toHaveBeenCalledTimes(1)
  expect(getSpy).toHaveBeenCalledTimes(1)
  expect(putSpy.mock.calls).toMatchSnapshot()

  v4Spy.mockRestore()

  AWS.restore()
})

test('generates occurrences using latest occurrence from database', async () => {
  expect.assertions(3)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        data: {
          ...scheduleDocument.data,
          strategy: {
            ...scheduleDocument.data.strategy,
            type: scheduling.StrategyTypes.Window,
          },
        },
        endAt: '2020-01-01T00:00:00.000Z',
        startAt: '2019-12-01T00:00:00.000Z',
      },
      {
        ...occurrenceDocument,
        endAt: '2019-02-11T00:14:59.999Z',
        locationId: 'area1',
        startAt: '2019-02-11T00:00:00.000Z',
      },
    ],
  })

  const v4Spy = jest.spyOn(uuid, 'v4')

  v4Spy.mockImplementation(jest.fn().mockReturnValue('1111-2222-3333-4444'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  await generateOccurrencesHandler(event, context)

  expect(querySpy).toHaveBeenCalledTimes(1)
  expect(getSpy).toHaveBeenCalledTimes(1)
  expect(putSpy.mock.calls).toMatchSnapshot()

  v4Spy.mockRestore()

  AWS.restore()
})

test('generates occurrences for schedule with multiple areas', async () => {
  expect.assertions(3)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockResolvedValue({})
  const querySpy = jest.fn().mockResolvedValue({
    Items: [
      {
        ...scheduleDocument,
        data: {
          ...scheduleDocument.data,
          areas: ['area1', 'area2', 'area3'],
        },
        endAt: '2020-01-01T00:00:00.000Z',
        startAt: '2019-12-01T00:00:00.000Z',
      },
    ],
  })
  const v4Spy = jest.spyOn(uuid, 'v4')

  v4Spy.mockImplementation(jest.fn().mockReturnValue('1111-2222-3333-4444'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  await generateOccurrencesHandler(event, context)

  expect(querySpy).toHaveBeenCalledTimes(1)
  expect(getSpy).toHaveBeenCalledTimes(3)
  expect(putSpy.mock.calls).toMatchSnapshot()

  v4Spy.mockRestore()

  AWS.restore()
})

test('handles error when occurrence document fails to save', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: scheduleLocationDocument })
  const putSpy = jest.fn().mockRejectedValue(new Error('Failed to save!'))
  const querySpy = jest.fn().mockResolvedValue({
    Items: [{ ...scheduleDocument, locationId: 'area1', areas: [] }],
  })
  const warnSpy = jest.spyOn(console, 'warn')
  const v4Spy = jest.spyOn(uuid, 'v4')

  v4Spy.mockImplementation(jest.fn().mockReturnValue('1111-2222-3333-4444'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = { scheduleId: 'schedule1' }
  const context = createContext()

  await generateOccurrencesHandler(event, context)

  expect(warnSpy.mock.calls).toMatchSnapshot()

  v4Spy.mockRestore()

  AWS.restore()
})
