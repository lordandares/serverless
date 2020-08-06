import { errors, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'

import { createContext, createSnsEvent } from '../../../../__test__/helpers'
import {
  context,
  occurrenceDocument,
  scheduleDocument,
  scheduleLocationDocument,
} from '../__fixtures__'

import { occurrenceResolvedHandler } from './occurrenceResolvedHandler'

const timestamp = '2019-01-01T01:00:00.000Z'

beforeEach(() => {
  process.env.ENSURE_OCCURRENCES_STEP_FUNCTION =
    'ensure-occurrences-step-function'
  process.env.IS_OFFLINE = 'true'
  process.env.TABLE_SCHEDULES = 'table-schedules'
  MockDate.set(timestamp)
})

afterEach(() => {
  AWS.restore()
  MockDate.reset()
})

test('application error when body missing', async () => {
  expect.assertions(1)

  const body = null

  try {
    await occurrenceResolvedHandler(createSnsEvent({ body }), context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: occurrenceResolvedHandler: missing body on event]`,
    )
  }
})

test('application error when occurrence missing', async () => {
  expect.assertions(1)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest.fn().mockResolvedValue({ Item: null })

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  try {
    await occurrenceResolvedHandler(createSnsEvent({ body }), context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ResourceNotFoundError: The Resource "occurrence" with ID of "{"pk":"application1-occurrence","sk":"2019-01-01T00:00-occurrence1"}" could not be found]`,
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
    await occurrenceResolvedHandler(createSnsEvent({ body }), context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[UnknownError: Something went wrong! Try again or contact support if the problem persists.]`,
    )
  }

  AWS.restore()
})

test('skips occurrence if status is not active', async () => {
  expect.assertions(3)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest
    .fn()
    .mockResolvedValue({ Item: { ...occurrenceDocument, status: 'expired' } })
  const startExecutionSpy = jest.fn().mockResolvedValue({})
  const updateSpy = jest
    .fn()
    .mockResolvedValue({ Attributes: occurrenceDocument })

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  await occurrenceResolvedHandler(createSnsEvent({ body }), context)

  expect(getSpy.mock.calls).toMatchSnapshot()
  expect(updateSpy).toBeCalledTimes(0)
  expect(startExecutionSpy).toBeCalledTimes(0)

  AWS.restore()
})

test('sets occurrence to resolved and invokes ensure occurrences step function', async () => {
  expect.assertions(3)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }

  const getSpy = jest
    .fn()
    .mockResolvedValue({ Item: { ...occurrenceDocument, status: 'active' } })
  const startExecutionSpy = jest.fn().mockResolvedValue({})
  const updateSpy = jest
    .fn()
    .mockResolvedValue({ Attributes: occurrenceDocument })

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'update', updateSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  await occurrenceResolvedHandler(createSnsEvent({ body }), context)

  expect(getSpy.mock.calls).toMatchSnapshot()
  expect(updateSpy.mock.calls).toMatchSnapshot()
  expect(startExecutionSpy.mock.calls).toMatchSnapshot()

  AWS.restore()
})
