import { eventConsumerHandler } from './eventConsumerHandler'

import { processorStrategies } from './lib/eventProcessors'

jest.mock('./lib/eventProcessors')

afterEach(() => jest.clearAllMocks())

test('handles no stream event', async () => {
  expect.assertions(1)

  const streamEvent = null

  try {
    await eventConsumerHandler(streamEvent)
  } catch (error) {
    expect(error).toMatchInlineSnapshot(
      `[ApplicationError: EventsConsumerHandler: missing event]`,
    )
  }
})

test('handles stream event which fails to parse json but continues to process and throws after', async () => {
  expect.assertions(3)

  const corruptPayload = '{'
  const validPayload = { data: {}, type: 'location' }

  const validEncodedPayload = Buffer.from(
    JSON.stringify(validPayload),
  ).toString('base64')
  const invalidEncodedPayload = Buffer.from(corruptPayload).toString('base64')

  const streamEvent = {
    Records: [
      { kinesis: { data: invalidEncodedPayload } },
      { kinesis: { data: validEncodedPayload } },
    ],
  }
  const errorSpy = jest.spyOn(console, 'error')

  try {
    await eventConsumerHandler(streamEvent)
  } catch (error) {
    expect(processorStrategies.location).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls).toMatchSnapshot()
    expect(error).toMatchSnapshot()
  }
})

test('handles stream event which has no type', async () => {
  expect.assertions(1)

  const payload = { data: {}, type: null }
  const json = JSON.stringify(payload)
  const encodedPayload = Buffer.from(json).toString('base64')
  const streamEvent = { Records: [{ kinesis: { data: encodedPayload } }] }

  await eventConsumerHandler(streamEvent)

  expect(processorStrategies.location).toHaveBeenCalledTimes(0)
})

test('handles stream event which has no type property', async () => {
  expect.assertions(1)

  const payload = { data: {} }
  const json = JSON.stringify(payload)
  const encodedPayload = Buffer.from(json).toString('base64')
  const streamEvent = { Records: [{ kinesis: { data: encodedPayload } }] }

  await eventConsumerHandler(streamEvent)

  expect(processorStrategies.location).toHaveBeenCalledTimes(0)
})

test('handles stream event which has no supported processor function', async () => {
  expect.assertions(1)

  const payload = {
    data: { timestamp: '2020-02-11T03:19:51.508+0000' },
    type: 'testing',
  }
  const json = JSON.stringify(payload)
  const encodedPayload = Buffer.from(json).toString('base64')
  const streamEvent = { Records: [{ kinesis: { data: encodedPayload } }] }

  await eventConsumerHandler(streamEvent)

  expect(processorStrategies.location).toHaveBeenCalledTimes(0)
})

test('handles stream event which has location type', async () => {
  expect.assertions(2)

  const payload = {
    data: { timestamp: '2020-02-11T03:19:51.508+0000' },
    type: 'location',
  }
  const json = JSON.stringify(payload)
  const encodedPayload = Buffer.from(json).toString('base64')
  const streamEvent = { Records: [{ kinesis: { data: encodedPayload } }] }

  await eventConsumerHandler(streamEvent)

  expect(processorStrategies.location).toHaveBeenCalledTimes(1)
  expect(processorStrategies.location).toHaveBeenCalledWith(payload)
})

test('handles stream events which are out of order', async () => {
  expect.assertions(2)

  const payload1 = {
    data: { timestamp: '2020-02-11T03:19:51.508+0000' },
    type: 'location',
  }
  const json1 = JSON.stringify(payload1)
  const encodedPayload1 = Buffer.from(json1).toString('base64')

  const payload2 = {
    data: { timestamp: '2020-02-11T09:19:51.508+0000' },
    type: 'location',
  }
  const json2 = JSON.stringify(payload2)
  const encodedPayload2 = Buffer.from(json2).toString('base64')

  const streamEvent = {
    Records: [
      { kinesis: { data: encodedPayload2 } },
      { kinesis: { data: encodedPayload1 } },
    ],
  }

  await eventConsumerHandler(streamEvent)

  expect(processorStrategies.location).toHaveBeenCalledTimes(2)
  expect(processorStrategies.location).toMatchSnapshot()
})

test('catches event processor errors and continues', async () => {
  expect.assertions(2)

  const payload1 = {
    data: { timestamp: '2020-02-11T03:19:00.000+0000' },
    type: 'location',
  }
  const json1 = JSON.stringify(payload1)
  const encodedPayload1 = Buffer.from(json1).toString('base64')

  const payload2 = {
    data: { timestamp: '2020-02-11T03:20:00.000+0000' },
    type: 'location',
  }
  const json2 = JSON.stringify(payload2)
  const encodedPayload2 = Buffer.from(json2).toString('base64')

  const payload3 = {
    data: { timestamp: '2020-02-11T03:21:00.000+0000' },
    type: 'location',
  }
  const json3 = JSON.stringify(payload3)
  const encodedPayload3 = Buffer.from(json3).toString('base64')

  const streamEvent = {
    Records: [
      { kinesis: { data: encodedPayload1 } },
      { kinesis: { data: encodedPayload2 } },
      { kinesis: { data: encodedPayload3 } },
    ],
  }

  processorStrategies.location
    .mockRejectedValueOnce(new Error('Unknown Error'))
    .mockResolvedValueOnce()
    .mockResolvedValueOnce()

  await eventConsumerHandler(streamEvent)

  expect(processorStrategies.location).toHaveBeenCalledTimes(3)
  expect(processorStrategies.location).toMatchSnapshot()
})

test('catches and rethrows errors', async () => {
  expect.assertions(1)

  try {
    await eventConsumerHandler({})
  } catch (error) {
    expect(error).toEqual(error)
  }
})
