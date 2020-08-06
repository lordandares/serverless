import { errors, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'

import { createContext, createSnsEvent } from '../../../../__test__/helpers'
import {
  context,
  occurrenceDocument,
  rulePatternDocument,
} from '../__fixtures__'
import { occurrenceActiveHandler } from './occurrenceActiveHandler'

const timestamp = '2019-01-01T01:00:00.000Z'

beforeEach(() => {
  process.env.IS_OFFLINE = 'true'
  process.env.TABLE_SCHEDULES = 'table-schedules'
  MockDate.set(timestamp)
})

afterEach(() => {
  AWS.restore()
  jest.clearAllMocks()
  MockDate.reset()
})

test('application error when body missing', async () => {
  expect.assertions(1)

  const body = null

  try {
    await occurrenceActiveHandler(createSnsEvent({ body }), context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: occurrenceActiveHandler: missing body on event]`,
    )
  }
})

test('unknown error', async () => {
  expect.assertions(1)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest.fn().mockRejectedValue(new Error('Unknown Error!'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  try {
    await occurrenceActiveHandler(createSnsEvent({ body }), context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[UnknownError: Something went wrong! Try again or contact support if the problem persists.]`,
    )
  }

  AWS.restore()
})

test('returns successfully when a new rule pattern document', async () => {
  expect.assertions(3)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: occurrenceDocument })
    .mockResolvedValueOnce({ Item: undefined })
  const transactSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactSpy)

  const result = await occurrenceActiveHandler(
    createSnsEvent({ body }),
    context,
  )

  expect(getSpy.mock.calls).toMatchSnapshot()
  expect(transactSpy.mock.calls).toMatchSnapshot()
  expect(result).toMatchSnapshot()
})

test('returns successfully when updating rule pattern document', async () => {
  expect.assertions(3)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: occurrenceDocument })
    .mockResolvedValueOnce({ Item: rulePatternDocument })
  const transactSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactSpy)

  const result = await occurrenceActiveHandler(
    createSnsEvent({ body }),
    context,
  )

  expect(getSpy.mock.calls).toMatchSnapshot()
  expect(transactSpy.mock.calls).toMatchSnapshot()
  expect(result).toMatchSnapshot()
})

test('skips and warns when occurrence missing', async () => {
  expect.assertions(1)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest.fn().mockResolvedValueOnce({ Item: undefined })
  const warnSpy = jest.spyOn(console, 'warn')

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  await occurrenceActiveHandler(createSnsEvent({ body }), context)

  expect(warnSpy).toHaveBeenCalledWith(
    'OccurrenceActiveHandler: The occurrence is missing so unable to add rule or set occurrence to active',
  )
})

test('skips and warns when occurrence is already active', async () => {
  expect.assertions(1)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({
      Item: { ...occurrenceDocument, status: 'active' },
    })
  const warnSpy = jest.spyOn(console, 'warn')

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  await occurrenceActiveHandler(createSnsEvent({ body }), context)

  expect(warnSpy).toHaveBeenCalledWith(
    'OccurrenceActiveHandler: occurrence already has active status so skipping',
    {
      occurrenceId: 'occurrence1',
    },
  )
})

test('application error when transactions fail', async () => {
  expect.assertions(1)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: occurrenceDocument })
    .mockResolvedValueOnce({ Item: rulePatternDocument })
  const transactSpy = jest
    .fn()
    .mockRejectedValue(new Error('Transaction Error!'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactSpy)

  try {
    await occurrenceActiveHandler(createSnsEvent({ body }), context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: Transaction Error!]`,
    )
  }

  AWS.restore()
})

test('patternDocument validation error', async () => {
  expect.assertions(1)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: occurrenceDocument })
    .mockResolvedValueOnce({ Item: null })

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  schemas.validate = jest.fn().mockRejectedValue(new Error('Validation Error'))

  try {
    await occurrenceActiveHandler(createSnsEvent({ body }), context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(`[ApplicationError: Validation Error]`)
  }
})
