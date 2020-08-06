import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'

import { processLocationEvent, processorStrategies } from './eventProcessors'

beforeEach(() => {
  process.env.IS_OFFLINE = 'true'
  process.env.OCCURRENCE_RESOLVED_ARN = 'occurrence-resolved'
  process.env.TABLE_SCHEDULES = 'table-schedules'

  MockDate.set('2020-01-01T12:00:00.000Z')
})

afterEach(() => {
  MockDate.reset()
  AWS.restore()
})

test('returns event type processor map', () => {
  expect(processorStrategies.location).toBeDefined()
})

test('process location event throws error if missing event', async () => {
  expect.assertions(1)

  const event = null

  try {
    await processLocationEvent(event)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: ProcessLocationEvent: Invalid event received]`,
    )
  }
})

test('process location event throws error if missing data property', async () => {
  expect.assertions(1)

  const event = { version: 'v1' }

  try {
    await processLocationEvent(event)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: ProcessLocationEvent: Invalid event received]`,
    )
  }
})

test('process location event throws error if missing version property', async () => {
  expect.assertions(1)

  const event = { data: {} }

  try {
    await processLocationEvent(event)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: ProcessLocationEvent: Invalid event received]`,
    )
  }
})

test('process location event throws error if missing data application property', async () => {
  expect.assertions(1)

  const event = { data: {}, version: 'v1' }

  try {
    await processLocationEvent(event)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: ProcessLocationEvent: event missing application property]`,
    )
  }
})

test('process location event skips if upsupported event version', async () => {
  expect.assertions(3)

  const getSpy = jest.fn()
  const publishSpy = jest.fn()
  const transactWriteSpy = jest.fn()

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('SNS', 'publish', publishSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1'] },
    },
    version: 'v999',
  }

  await processLocationEvent(event)

  expect(getSpy).toHaveBeenCalledTimes(0)
  expect(publishSpy).toHaveBeenCalledTimes(0)
  expect(transactWriteSpy).toHaveBeenCalledTimes(0)
})

test('process location event skips if empty areas array', async () => {
  expect.assertions(3)

  const getSpy = jest.fn()
  const publishSpy = jest.fn()
  const transactWriteSpy = jest.fn()

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('SNS', 'publish', publishSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: [] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toHaveBeenCalledTimes(0)
  expect(publishSpy).toHaveBeenCalledTimes(0)
  expect(transactWriteSpy).toHaveBeenCalledTimes(0)
})

test('process location event skips if missing areas property', async () => {
  expect.assertions(3)

  const getSpy = jest.fn()
  const publishSpy = jest.fn()
  const transactWriteSpy = jest.fn()

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('SNS', 'publish', publishSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toHaveBeenCalledTimes(0)
  expect(publishSpy).toHaveBeenCalledTimes(0)
  expect(transactWriteSpy).toHaveBeenCalledTimes(0)
})

test('process location event queries dynamo db with correct pattern queries', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({})
  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1', 'building1', 'floor1', 'room1', 'point1'] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toMatchSnapshot()
})

test('process location event skips processing when rule pattern does not have any matches and removes rule pattern', async () => {
  expect.assertions(2)

  const rulePatternItem = {
    createdAt: '2020-02-04T04:14:07.927Z',
    createdBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
    matches: {},
    pk: 'rule-pattern-565e42d3d4c628373ab25231-5e387fb11ed857124c81edfc',
    sk: 'visit',
    updatedAt: '2020-02-04T04:46:55.582Z',
    updatedBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
  }

  const getSpy = jest.fn().mockResolvedValue({ Item: rulePatternItem })
  const transactWriteSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1'] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toMatchSnapshot()
  expect(transactWriteSpy).toMatchSnapshot()
})

test('process location event skips processing if rule pattern matches does not match location and user on event', async () => {
  expect.assertions(2)

  const rulePatternItem = {
    createdAt: '2020-02-04T04:14:07.927Z',
    createdBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
    matches: {
      'bbe5f6a4-9469-49c9-b1db-11da06218dd7': {
        locationId: '12345687890',
        userId: '09876543210',
      },
    },
    pk: 'rule-pattern-565e42d3d4c628373ab25231-5e387fb11ed857124c81edfc',
    sk: 'visit',
    updatedAt: '2020-02-04T04:46:55.582Z',
    updatedBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
  }

  const getSpy = jest.fn().mockResolvedValue({ Item: rulePatternItem })
  const transactWriteSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1'] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toMatchSnapshot()
  expect(transactWriteSpy).toBeCalledTimes(0)
})

test('process location event skips processing if rule pattern match document is missing', async () => {
  expect.assertions(2)

  const rulePatternItem = {
    createdAt: '2020-02-04T04:14:07.927Z',
    createdBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
    matches: {
      '1f745559-fd6b-43cc-ad94-8f95beb791eb': {},
    },
    pk: 'rule-pattern-565e42d3d4c628373ab25231-5e387fb11ed857124c81edfc',
    sk: 'visit',
    updatedAt: '2020-02-04T04:46:55.582Z',
    updatedBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: rulePatternItem })
    .mockResolvedValueOnce({ Item: null })

  const transactWriteSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1'] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toMatchSnapshot()
  expect(transactWriteSpy).toMatchSnapshot()
})

test('process location event skips processing if rule pattern match document is in the future', async () => {
  expect.assertions(3)

  const ruleMatchItem = {
    applicationId: 'application1',
    createdAt: '2019-01-01T00:00:00.000Z',
    createdBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
    data: {
      occurrenceInterval: [1, 2],
      scheduleName: 'Schedule 1',
      serviceInterval: [1, 2],
      timezone: 'Australia/Melbourne',
      type: 'visit',
    },
    endAt: '2020-01-03T00:00:00.000Z',
    groupType: 'occurrence',
    locationId: '5d163137b8b3b7000127edd1',
    location_endAt_occurrenceId:
      'location1-2019-02-02T00:00:00.000Z-occurrence1',
    occurrenceId: 'occurrence1',
    pk: 'application1-occurrence',
    scheduleId: 'schedule1',
    sk: '2019-01-01T00:00-occurrence1',
    startAt: '2020-01-02T00:00:00.000Z',
    updatedBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
  }

  const rulePatternItem = {
    createdAt: '2020-02-04T04:14:07.927Z',
    createdBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
    matches: {
      '1f745559-fd6b-43cc-ad94-8f95beb791eb': {},
    },
    pk: 'rule-pattern-565e42d3d4c628373ab25231-5e387fb11ed857124c81edfc',
    sk: 'visit',
    updatedAt: '2020-02-04T04:46:55.582Z',
    updatedBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: rulePatternItem })
    .mockResolvedValueOnce({ Item: ruleMatchItem })

  const transactWriteSpy = jest.fn().mockResolvedValue({})
  const publishSpy = jest.fn()

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('SNS', 'publish', publishSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1'] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toMatchSnapshot()
  expect(publishSpy).toHaveBeenCalledTimes(0)
  expect(transactWriteSpy).toMatchSnapshot()
})

test('process location event skips processing if rule pattern match document has expired', async () => {
  expect.assertions(3)

  const ruleMatchItem = {
    applicationId: 'application1',
    createdAt: '2019-01-01T00:00:00.000Z',
    createdBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
    data: {
      occurrenceInterval: [1, 2],
      scheduleName: 'Schedule 1',
      serviceInterval: [1, 2],
      timezone: 'Australia/Melbourne',
      type: 'visit',
    },
    endAt: '2019-01-03T00:00:00.000Z',
    groupType: 'occurrence',
    locationId: '5d163137b8b3b7000127edd1',
    location_endAt_occurrenceId:
      'location1-2019-02-02T00:00:00.000Z-occurrence1',
    occurrenceId: 'occurrence1',
    pk: 'application1-occurrence',
    scheduleId: 'schedule1',
    sk: '2019-01-01T00:00-occurrence1',
    startAt: '2019-01-02T00:00:00.000Z',
    updatedBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
  }

  const rulePatternItem = {
    createdAt: '2020-02-04T04:14:07.927Z',
    createdBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
    matches: {
      '1f745559-fd6b-43cc-ad94-8f95beb791eb': {},
    },
    pk: 'rule-pattern-565e42d3d4c628373ab25231-5e387fb11ed857124c81edfc',
    sk: 'visit',
    updatedAt: '2020-02-04T04:46:55.582Z',
    updatedBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: rulePatternItem })
    .mockResolvedValueOnce({ Item: ruleMatchItem })

  const transactWriteSpy = jest.fn().mockResolvedValue({})

  const publishSpy = jest.fn()

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('SNS', 'publish', publishSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1'] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toMatchSnapshot()
  expect(publishSpy).toHaveBeenCalledTimes(0)
  expect(transactWriteSpy).toMatchSnapshot()
})

test('process location event processes rule pattern when single match', async () => {
  expect.assertions(3)

  const ruleMatchItem = {
    applicationId: 'application1',
    createdAt: '2019-01-01T00:00:00.000Z',
    createdBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
    data: {
      occurrenceInterval: [1, 2],
      scheduleName: 'Schedule 1',
      serviceInterval: [1, 2],
      timezone: 'Australia/Melbourne',
      type: 'visit',
    },
    endAt: '2020-01-03T00:00:00.000Z',
    groupType: 'occurrence',
    locationId: '5d163137b8b3b7000127edd1',
    location_endAt_occurrenceId:
      'location1-2019-02-02T00:00:00.000Z-occurrence1',
    occurrenceId: 'occurrence1',
    pk: 'application1-occurrence',
    scheduleId: 'schedule1',
    sk: '2019-01-01T00:00-occurrence1',
    startAt: '2020-01-01T00:00:00.000Z',
    updatedBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
  }

  const rulePatternItem = {
    createdAt: '2020-02-04T04:14:07.927Z',
    createdBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
    matches: {
      '1f745559-fd6b-43cc-ad94-8f95beb791eb': {},
    },
    pk: 'rule-pattern-565e42d3d4c628373ab25231-5e387fb11ed857124c81edfc',
    sk: 'visit',
    updatedAt: '2020-02-04T04:46:55.582Z',
    updatedBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: rulePatternItem })
    .mockResolvedValueOnce({ Item: ruleMatchItem })

  const publishSpy = jest.fn().mockResolvedValue({})
  const transactWriteSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('SNS', 'publish', publishSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1'] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toMatchSnapshot()
  expect(publishSpy).toMatchSnapshot()
  expect(transactWriteSpy).toMatchSnapshot()
})

test('process location event processes rule pattern when multiple matches', async () => {
  expect.assertions(3)

  const ruleMatchItem = {
    applicationId: 'application1',
    createdAt: '2019-01-01T00:00:00.000Z',
    createdBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
    data: {
      occurrenceInterval: [1, 2],
      scheduleName: 'Schedule 1',
      serviceInterval: [1, 2],
      timezone: 'Australia/Melbourne',
      type: 'visit',
    },
    endAt: '2020-01-03T00:00:00.000Z',
    groupType: 'occurrence',
    locationId: '5d163137b8b3b7000127edd1',
    location_endAt_occurrenceId:
      'location1-2019-02-02T00:00:00.000Z-occurrence1',
    occurrenceId: 'occurrence1',
    pk: 'application1-occurrence',
    scheduleId: 'schedule1',
    sk: '2019-01-01T00:00-occurrence1',
    startAt: '2020-01-01T00:00:00.000Z',
    updatedBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
  }

  const rulePatternItem = {
    createdAt: '2020-02-04T04:14:07.927Z',
    createdBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
    matches: {
      '1f745559-fd6b-43cc-ad94-8f95beb791eb': {},
      '1f745559-fd6b-43cc-ad94-8f95beb791ec': {},
      '1f745559-fd6b-43cc-ad94-8f95beb791ed': {},
    },
    pk: 'rule-pattern-565e42d3d4c628373ab25231-5e387fb11ed857124c81edfc',
    sk: 'visit',
    updatedAt: '2020-02-04T04:46:55.582Z',
    updatedBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: rulePatternItem })
    .mockResolvedValueOnce({ Item: ruleMatchItem })
    .mockResolvedValueOnce({ Item: ruleMatchItem })
    .mockResolvedValueOnce({ Item: ruleMatchItem })

  const publishSpy = jest.fn().mockResolvedValue({})
  const transactWriteSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('SNS', 'publish', publishSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1'] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toMatchSnapshot()
  expect(publishSpy).toMatchSnapshot()
  expect(transactWriteSpy).toMatchSnapshot()
})

test('process location event processes rule pattern and handles errors when resolving match', async () => {
  expect.assertions(3)

  const ruleMatchItem = {
    applicationId: 'application1',
    createdAt: '2019-01-01T00:00:00.000Z',
    createdBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
    data: {
      occurrenceInterval: [1, 2],
      scheduleName: 'Schedule 1',
      serviceInterval: [1, 2],
      timezone: 'Australia/Melbourne',
      type: 'visit',
    },
    endAt: '2020-01-03T00:00:00.000Z',
    groupType: 'occurrence',
    locationId: '5d163137b8b3b7000127edd1',
    location_endAt_occurrenceId:
      'location1-2019-02-02T00:00:00.000Z-occurrence1',
    occurrenceId: 'occurrence1',
    pk: 'application1-occurrence',
    scheduleId: 'schedule1',
    sk: '2019-01-01T00:00-occurrence1',
    startAt: '2020-01-01T00:00:00.000Z',
    updatedBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
  }

  const rulePatternItem = {
    createdAt: '2020-02-04T04:14:07.927Z',
    createdBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
    matches: {
      '1f745559-fd6b-43cc-ad94-8f95beb791eb': {},
    },
    pk: 'rule-pattern-565e42d3d4c628373ab25231-5e387fb11ed857124c81edfc',
    sk: 'visit',
    updatedAt: '2020-02-04T04:46:55.582Z',
    updatedBy: {
      id: '69817454-eb9d-41ec-9c07-6abcefe387fe',
      label:
        'arn:aws:lambda:us-east-1:649076221710:function:schedule-service-develop-createRule',
      type: 'system',
    },
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: rulePatternItem })
    .mockResolvedValueOnce({ Item: ruleMatchItem })

  const publishSpy = jest.fn().mockRejectedValue(new Error('Unknown Error'))
  const transactWriteSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)
  AWS.mock('SNS', 'publish', publishSpy)

  const event = {
    data: {
      application: { _id: 'application1' },
      area: { ids: ['location1'] },
    },
    version: 'v1',
  }

  await processLocationEvent(event)

  expect(getSpy).toMatchSnapshot()
  expect(publishSpy).toMatchSnapshot()
  expect(transactWriteSpy).toMatchSnapshot()
})
