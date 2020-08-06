import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'

import { occurrenceTimerDocument } from '../__fixtures__'

import { timerProcessorHandler } from './timerProcessorHandler'

beforeEach(() => {
  process.env.IS_OFFLINE = 'true'
  process.env.TABLE_SCHEDULES = 'table-schedules'
})

afterEach(() => {
  AWS.restore()
})

test('successful timer processing', async () => {
  expect.assertions(1)

  const deleteSpy = jest.fn().mockResolvedValue({})

  const querySpy = jest
    .fn()
    .mockResolvedValueOnce({ Items: [{ ...occurrenceTimerDocument }] })
    .mockResolvedValueOnce({
      Items: [
        {
          ...occurrenceTimerDocument,
          pk: 'timer-2018-12-31T23:59',
          sk: 'timer#application1-occurrence#timer-2018-12-31T23:59-occurrence',
        },
      ],
    })

  const snsSpy = jest.fn().mockResolvedValue('success')

  AWS.mock('DynamoDB.DocumentClient', 'delete', deleteSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('SNS', 'publish', snsSpy)

  const result = await timerProcessorHandler()

  expect(result).toMatchInlineSnapshot(`
Array [
  Object {
    "pk": "timer-2019-01-01T00:00",
    "sk": "timer#application1-occurrence#2019-01-01T00:00-occurrence",
  },
  Object {
    "pk": "timer-2018-12-31T23:59",
    "sk": "timer#application1-occurrence#timer-2018-12-31T23:59-occurrence",
  },
]
`)
})

test('error when querying for timers', async () => {
  expect.assertions(1)

  const querySpy = jest.fn().mockRejectedValue(new Error('NetworkError'))

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  try {
    await timerProcessorHandler()
  } catch (error) {
    expect(error).toMatchInlineSnapshot(`[Error: NetworkError]`)
  }
})

test('handles no timers to process', async () => {
  expect.assertions(1)

  const querySpy = jest
    .fn()
    .mockResolvedValueOnce({ Items: [] })
    .mockResolvedValueOnce({ Items: [] })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await timerProcessorHandler()

  expect(result).toMatchInlineSnapshot(`Array []`)
})

test('handles no timers to process when missing items', async () => {
  expect.assertions(1)

  const querySpy = jest
    .fn()
    .mockResolvedValueOnce({ Items: null })
    .mockResolvedValueOnce({ Items: null })

  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)

  const result = await timerProcessorHandler()

  expect(result).toMatchInlineSnapshot(`Array []`)
})

test('handles sns error but continues to process and throws after', async () => {
  expect.assertions(1)

  const deleteSpy = jest.fn().mockResolvedValue({})

  const querySpy = jest
    .fn()
    .mockResolvedValueOnce({
      Items: [{ ...occurrenceTimerDocument }, { ...occurrenceTimerDocument }],
    })
    .mockResolvedValueOnce({ Items: [] })

  const snsSpy = jest
    .fn()
    .mockRejectedValueOnce(new Error('Processing Error'))
    .mockResolvedValueOnce('success')

  AWS.mock('DynamoDB.DocumentClient', 'delete', deleteSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('SNS', 'publish', snsSpy)

  try {
    await timerProcessorHandler()
  } catch (error) {
    expect(error).toMatchSnapshot()
  }
})

test('handles delete error but continues to process and throws after', async () => {
  expect.assertions(1)

  const deleteSpy = jest
    .fn()
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(new Error('Delete Error'))

  const querySpy = jest
    .fn()
    .mockResolvedValueOnce({
      Items: [{ ...occurrenceTimerDocument }, { ...occurrenceTimerDocument }],
    })
    .mockResolvedValueOnce({ Items: [] })

  const snsSpy = jest
    .fn()
    .mockResolvedValueOnce('success')
    .mockResolvedValueOnce('success')

  AWS.mock('DynamoDB.DocumentClient', 'delete', deleteSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('SNS', 'publish', snsSpy)

  try {
    await timerProcessorHandler()
  } catch (error) {
    expect(error).toMatchSnapshot()
  }
})

test('skips removing timers when none processed', async () => {
  expect.assertions(1)

  const deleteSpy = jest.fn().mockResolvedValue({})

  const querySpy = jest
    .fn()
    .mockResolvedValue({
      Items: [{ ...occurrenceTimerDocument }, { ...occurrenceTimerDocument }],
    })
    .mockResolvedValueOnce({ Items: [] })

  const snsSpy = jest
    .fn()
    .mockRejectedValueOnce(new Error('Processing Error 1'))
    .mockRejectedValueOnce(new Error('Processing Error 2'))

  AWS.mock('DynamoDB.DocumentClient', 'delete', deleteSpy)
  AWS.mock('DynamoDB.DocumentClient', 'query', querySpy)
  AWS.mock('SNS', 'publish', snsSpy)

  try {
    await timerProcessorHandler()
  } catch (error) {
    expect(deleteSpy).toHaveBeenCalledTimes(0)
  }
})
