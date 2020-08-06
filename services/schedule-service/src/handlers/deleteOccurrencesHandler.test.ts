import { mongo, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk-mock'

import { occurrenceDocument } from '../__fixtures__'
import { ScheduleService } from '../service/ScheduleService'
import { deleteOccurrencesHandler } from './deleteOccurrencesHandler'

beforeEach(() => {
  process.env.TABLE_SCHEDULES = 'table-schedules'
})

test('application error returned when event', async () => {
  expect.assertions(1)

  const event = null

  try {
    await deleteOccurrencesHandler(event)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: DeleteOccurrencesHandler: missing event]`,
    )
  }
})

test('application error returned when missing scheduleId', async () => {
  expect.assertions(1)

  const event = {
    scheduleId: null as any,
  }

  try {
    await deleteOccurrencesHandler(event)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: The schedule \`id\` of the resource to delete is missing]`,
    )
  }
})

test('application error returned when querying for occurrences errors', async () => {
  expect.assertions(1)

  const occurrences = [{ ...occurrenceDocument }]

  const querySpy = jest.fn().mockRejectedValue(new Error('Query Error'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = {
    scheduleId: 'schedule1',
  }

  try {
    await deleteOccurrencesHandler(event)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(`[ApplicationError: Query Error]`)
  }

  AWS.restore()
})

test('application error returned when removing occurrences errors', async () => {
  expect.assertions(1)

  const occurrences = [{ ...occurrenceDocument }]

  const querySpy = jest.fn().mockResolvedValue({ Items: occurrences })
  const transactWriteSpy = jest
    .fn()
    .mockRejectedValue(new Error('Remove Error'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)

  const event = {
    scheduleId: 'schedule1',
  }

  try {
    await deleteOccurrencesHandler(event)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(`[ApplicationError: Remove Error]`)
  }

  AWS.restore()
})

test('generic error', async () => {
  expect.assertions(1)

  const removeOccurrencesSpy = jest.spyOn(ScheduleService, 'deleteOccurrences')

  removeOccurrencesSpy.mockImplementation(
    jest.fn().mockRejectedValueOnce(new Error('Unknown Error')),
  )

  const event = {
    scheduleId: 'schedule1',
  }

  try {
    await deleteOccurrencesHandler(event)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[UnknownError: Something went wrong! Try again or contact support if the problem persists.]`,
    )
  }

  removeOccurrencesSpy.mockRestore()
})

test('returns no results when schedule has no occurrences', async () => {
  expect.assertions(2)

  const querySpy = jest.fn().mockResolvedValue({ Items: [] })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const event = {
    scheduleId: 'schedule1',
  }

  const result = await deleteOccurrencesHandler(event)

  expect(querySpy.mock.calls).toMatchSnapshot()
  expect(result).toEqual([])

  AWS.restore()
})

test('returns removed results when schedule has occurrences', async () => {
  expect.assertions(3)

  const occurrences = [{ ...occurrenceDocument }]

  const querySpy = jest.fn().mockResolvedValue({ Items: occurrences })
  const transactWriteSpy = jest.fn().mockResolvedValue([])

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('DynamoDB.DocumentClient', 'transactWrite', transactWriteSpy)

  const event = {
    scheduleId: 'schedule1',
  }

  const result = await deleteOccurrencesHandler(event)

  expect(querySpy.mock.calls).toMatchSnapshot()
  expect(transactWriteSpy.mock.calls).toMatchSnapshot()
  expect(result).toEqual([])

  AWS.restore()
})
