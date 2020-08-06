import { schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'

import * as MockDate from 'mockdate'
import {
  context,
  occurrenceDocument,
  rulePatternDocument,
  rulePayload,
} from '../../__fixtures__'
import { createRuleHandler } from './createRuleHandler'

jest.mock('uuid/v4', () => () => 'action-uuid-1234')

beforeEach(() => {
  process.env.IS_OFFLINE = 'true'
  process.env.OCCURRENCE_ACTIVE_ARN = 'occurrence-active-arn'
  process.env.TABLE_SCHEDULES = 'table-schedules'
  MockDate.set('2019-02-01T01:00:00.000Z')
})

afterEach(() => MockDate.reset())

test('application error when body missing', async () => {
  expect.assertions(1)

  try {
    await createRuleHandler(null, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: A rule body is required]`,
    )
  }
})

test('validates against schema', async () => {
  expect.assertions(1)

  const validateSpy = jest.spyOn(schemas, 'validate')
  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: undefined })
    .mockResolvedValueOnce({ Item: occurrenceDocument })
  const transactSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactSpy)

  await createRuleHandler(rulePayload, context)

  expect(validateSpy).toHaveBeenCalledWith({
    data: rulePayload,
    schema: schemas.rulePayloadSchema,
  })

  validateSpy.mockRestore()

  AWS.restore()
})

test('creates timer document when occurrence starts in the future', async () => {
  expect.assertions(1)

  const putSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'put', putSpy)

  const payload = { ...rulePayload, startAt: '2020-01-01T00:00:00.000Z' }
  await createRuleHandler(payload, context)

  expect(putSpy.mock.calls).toMatchSnapshot()

  AWS.restore()
})

test('creates new rule pattern document when none existing', async () => {
  expect.assertions(2)

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: undefined })
    .mockResolvedValueOnce({ Item: occurrenceDocument })
  const transactSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactSpy)

  await createRuleHandler(rulePayload, context)

  expect(getSpy.mock.calls).toMatchSnapshot()
  expect(transactSpy.mock.calls).toMatchSnapshot()

  AWS.restore()
})

test('updates existing rule pattern document when one exists', async () => {
  expect.assertions(2)

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: rulePatternDocument })
    .mockResolvedValueOnce({ Item: occurrenceDocument })
  const transactSpy = jest.fn().mockResolvedValue({})

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactSpy)

  await createRuleHandler(rulePayload, context)

  expect(getSpy.mock.calls).toMatchSnapshot()
  expect(transactSpy.mock.calls).toMatchSnapshot()

  AWS.restore()
})

test('application error when occurrence missing', async () => {
  expect.assertions(1)

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: rulePatternDocument })
    .mockResolvedValueOnce({ Item: undefined })

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  try {
    await createRuleHandler(rulePayload, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The occurrence is missing so unable to add rule or set occurrence to active]`,
    )
  }

  AWS.restore()
})

test('application error when transactions fail', async () => {
  expect.assertions(1)

  const getSpy = jest
    .fn()
    .mockResolvedValueOnce({ Item: rulePatternDocument })
    .mockResolvedValueOnce({ Item: occurrenceDocument })
  const transactSpy = jest
    .fn()
    .mockRejectedValue(new Error('Transaction Error!'))

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactSpy)

  try {
    await createRuleHandler(rulePayload, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: Transaction Error!]`,
    )
  }

  AWS.restore()
})

test('patternDocument validation error', async () => {
  expect.assertions(1)

  const getSpy = jest.fn().mockResolvedValue({ Item: undefined })

  AWS.mock('DynamoDB.DocumentClient', 'get', getSpy)

  schemas.validate = jest
    .fn()
    .mockResolvedValueOnce({})
    .mockRejectedValue(new Error('Validation Error 2'))

  try {
    await createRuleHandler(rulePayload, context)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: Validation Error 2]`,
    )
  }

  AWS.restore()
})
