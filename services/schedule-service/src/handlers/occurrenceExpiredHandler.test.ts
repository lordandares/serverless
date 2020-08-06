import { errors } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'
import { occurrenceExpiredHandler } from './occurrenceExpiredHandler'

import { createContext, createSnsEvent } from '../../../../__test__/helpers'
import { occurrenceDocument } from '../__fixtures__'
import { OCCURRENCE_STATUS_EXPIRED } from '../constants'

jest.mock('./lib/TimerService')

const timestamp = '2019-01-01T01:00:00.000Z'

beforeEach(() => {
  process.env.CREATE_EXCEPTION_ARN = 'create-exception'
  process.env.ENSURE_OCCURRENCES_STEP_FUNCTION =
    'ensure-occurrences-step-function'
  process.env.TABLE_SCHEDULES = 'table-schedules'

  MockDate.set(timestamp)
})

test('application error when body missing', async () => {
  expect.assertions(2)

  const updateSpy = jest
    .fn()
    .mockRejectedValue(new Error('ConditionalCheckFailedException'))

  AWS.mock('DynamoDB.DocumentClient', 'update', updateSpy)

  const body = null
  const context = createContext()

  try {
    await occurrenceExpiredHandler(createSnsEvent({ body }), context)
  } catch (err) {
    await expect(err).toBeInstanceOf(errors.ApplicationError)

    await expect(err).toHaveProperty(
      'message',
      'occurrenceExpiredHandler: missing body on event',
    )

    AWS.restore()
  }
})

test('application error when occurrence missing', async () => {
  expect.assertions(1)

  const body = {
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
  }
  const context = createContext()

  const getSpy = jest.fn().mockResolvedValue({ Item: null })

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  try {
    await occurrenceExpiredHandler(createSnsEvent({ body }), context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ResourceNotFoundError: The Resource "occurrence" with ID of "{"pk":"application1-occurrence","sk":"2019-01-01T00:00-occurrence1"}" could not be found]`,
    )
  }

  AWS.restore()
})

test('unknown error', async () => {
  expect.assertions(1)

  const getSpy = jest
    .fn()
    .mockResolvedValue({ Item: { ...occurrenceDocument, status: 'active' } })
  const updateSpy = jest.fn().mockRejectedValue(new Error('Unknown error'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'update', updateSpy)

  const pk = 'application1-schedule'
  const sk = '2019-01-01T00:00:00.000Z-occurrence1'
  const body = { pk, sk }
  const context = createContext()

  try {
    await occurrenceExpiredHandler(createSnsEvent({ body }), context)
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
  const context = createContext()

  const getSpy = jest
    .fn()
    .mockResolvedValue({ Item: { ...occurrenceDocument, status: 'resolved' } })
  const startExecutionSpy = jest.fn().mockResolvedValue({})
  const updateSpy = jest
    .fn()
    .mockResolvedValue({ Attributes: occurrenceDocument })

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  await occurrenceExpiredHandler(createSnsEvent({ body }), context)

  expect(getSpy.mock.calls).toMatchSnapshot()
  expect(updateSpy).toBeCalledTimes(0)
  expect(startExecutionSpy).toBeCalledTimes(0)

  AWS.restore()
})

test('sets occurrence to expired and invokes ensure occurrences step function', async () => {
  expect.assertions(4)

  const getSpy = jest
    .fn()
    .mockResolvedValue({ Item: { ...occurrenceDocument, status: 'active' } })
  const snsSpy = jest.fn().mockResolvedValue({ MessageId: 'message-uid' })
  const startExecutionSpy = jest.fn().mockResolvedValue({})
  const updateSpy = jest
    .fn()
    .mockResolvedValue({ Attributes: occurrenceDocument })

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'update', updateSpy)
  AWS.mock('SNS', 'publish', snsSpy)
  AWS.mock('StepFunctions', 'startExecution', startExecutionSpy)

  const pk = 'application1-schedule'
  const sk = '2019-01-01T00:00:00.000Z-occurrence1'
  const body = { pk, sk }
  const context = createContext()

  const result = await occurrenceExpiredHandler(
    createSnsEvent({ body }),
    context,
  )

  expect(updateSpy).toHaveBeenCalledWith(
    {
      AttributeUpdates: {
        expiredAt: {
          Action: 'PUT',
          Value: timestamp,
        },
        expiredBy: {
          Action: 'PUT',
          Value: 'invokedFunctionArn',
        },
        status: {
          Action: 'PUT',
          Value: OCCURRENCE_STATUS_EXPIRED,
        },
        updatedAt: {
          Action: 'PUT',
          Value: timestamp,
        },
        updatedBy: {
          Action: 'PUT',
          Value: {
            id: 'awsRequestId',
            label: 'invokedFunctionArn',
            type: 'system',
          },
        },
      },
      Key: { pk, sk },
      ReturnValues: 'ALL_NEW',
      TableName: process.env.TABLE_SCHEDULES,
    },
    expect.any(Function),
  )

  expect(result).toMatchSnapshot()
  expect(snsSpy.mock.calls).toMatchSnapshot()
  expect(startExecutionSpy.mock.calls).toMatchSnapshot()

  AWS.restore()
})
